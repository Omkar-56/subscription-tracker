import { reminderModel } from '../models/reminderModel.js';
import { subscriptionModel } from '../models/subscriptionModel.js';
import { userModel } from '../models/userModel.js';
import { parseDateParts, formatDateString } from './subscriptionService.js';
import { sendEmail, buildReminderEmailHtml, buildReminderEmailText } from './emailService.js';
import { env } from '../config/env.js';

export const reminderService = {
  /**
   * Scans active subscriptions due within the reminder window (default 2 days before renewal)
   * and sends an email reminder to the user.
   *
   * Can be run for a single user (e.g. manual trigger) or for all users (e.g. Cloudflare Cron Trigger).
   */
  async sendDueReminders({ userId = null, force = false } = {}) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let candidates = [];

    if (userId) {
      const user = await userModel.findById(userId);
      if (!user) return { totalChecked: 0, sentCount: 0, results: [] };
      const subs = await subscriptionModel.findAllForUser(userId);
      candidates = subs
        .filter((s) => s.status === 'active')
        .map((s) => ({
          ...s,
          userEmail: user.email,
          userName: user.name,
        }));
    } else {
      candidates = await subscriptionModel.findUpcomingAcrossAllUsers();
    }

    const sentResults = [];

    for (const sub of candidates) {
      try {
        const isTrial = Boolean(sub.isFreeTrial);
        const deadlineDateStr = isTrial
          ? sub.cancellationDeadline || sub.trialEndDate || sub.nextRenewalDate
          : sub.nextRenewalDate;

        if (!deadlineDateStr) continue;

        const targetDate = parseDateParts(deadlineDateStr);
        const diffDays = Math.round((targetDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));

        // Send reminder if due in 0 to 2 days (or custom reminderDaysBefore, default 2)
        const reminderDays = sub.reminderDaysBefore || 2;
        const isWithinWindow = diffDays <= reminderDays && diffDays >= 0;

        if (!isWithinWindow && !force) {
          continue;
        }

        // Avoid sending multiple reminder emails for the same subscription on the same calendar day
        if (!force) {
          const sentToday = await reminderModel.findSentTodayForSubscription(sub.userId, sub.id);
          if (sentToday) {
            continue;
          }
        }

        const formattedDueDate = formatDateString(targetDate);
        const daysText =
          diffDays === 0
            ? 'due today'
            : diffDays === 1
            ? 'due tomorrow'
            : `due in ${diffDays} days`;

        const subject = isTrial
          ? `SubTrack Alert: ${sub.name} trial ends ${daysText}!`
          : `SubTrack Reminder: ${sub.name} is ${daysText} (${sub.currency} ${Number(sub.amount).toFixed(2)})`;

        const appUrl = env.clientOrigin || 'http://localhost:3000';

        const html = buildReminderEmailHtml({
          userName: sub.userName,
          subscriptionName: sub.name,
          category: sub.category,
          amount: sub.amount,
          currency: sub.currency,
          billingCycle: sub.billingCycle,
          dueDateFormatted: formattedDueDate,
          daysLeft: diffDays,
          isTrial,
          postTrialAmount: sub.postTrialAmount,
          postTrialCurrency: sub.postTrialCurrency,
          appUrl,
        });

        const text = buildReminderEmailText({
          userName: sub.userName,
          subscriptionName: sub.name,
          amount: sub.amount,
          currency: sub.currency,
          billingCycle: sub.billingCycle,
          dueDateFormatted: formattedDueDate,
          daysLeft: diffDays,
          isTrial,
          postTrialAmount: sub.postTrialAmount,
          postTrialCurrency: sub.postTrialCurrency,
          appUrl,
        });

        // 1. Send the email notification
        const emailResult = await sendEmail({
          to: sub.userEmail,
          subject,
          html,
          text,
        });

        // 2. Record notification in in-app reminders table
        const reminderRecord = await reminderModel.create({
          userId: sub.userId,
          subscriptionId: sub.id,
          dueDate: formattedDueDate,
          status: 'pending',
          sentAt: new Date(),
          channel: 'email',
          message: isTrial
            ? `${sub.name} free trial ends ${daysText} (${formattedDueDate}).`
            : `${sub.name} renewal of ${sub.currency} ${Number(sub.amount).toFixed(2)} is ${daysText}.`,
        });

        // 3. Mark subscription's last reminder timestamp
        await subscriptionModel.updateReminderSentAt(sub.userId, sub.id, new Date());

        sentResults.push({
          subscriptionId: sub.id,
          name: sub.name,
          to: sub.userEmail,
          daysLeft: diffDays,
          provider: emailResult.provider,
          reminderId: reminderRecord.id,
        });
      } catch (err) {
        console.error(`[Reminder Error] Failed to process subscription ${sub.id}:`, err.message);
      }
    }

    return {
      totalChecked: candidates.length,
      sentCount: sentResults.length,
      results: sentResults,
    };
  },

  /**
   * Send a test reminder email to the authenticated user for verification
   */
  async sendTestReminderEmail(userId) {
    const user = await userModel.findById(userId);
    if (!user) throw new Error('User not found');

    const subs = await subscriptionModel.findAllForUser(userId);
    const sampleSub = subs[0] || {
      name: 'Sample Subscription (Netflix)',
      category: 'entertainment',
      amount: '15.99',
      currency: user.baseCurrency || 'INR',
      billingCycle: 'monthly',
      nextRenewalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      isFreeTrial: false,
    };

    const dueDateFormatted = sampleSub.nextRenewalDate ? String(sampleSub.nextRenewalDate).slice(0, 10) : 'in 2 days';
    const appUrl = env.clientOrigin || 'http://localhost:3000';

    const html = buildReminderEmailHtml({
      userName: user.name,
      subscriptionName: sampleSub.name,
      category: sampleSub.category || 'entertainment',
      amount: sampleSub.amount,
      currency: sampleSub.currency || user.baseCurrency || 'INR',
      billingCycle: sampleSub.billingCycle || 'monthly',
      dueDateFormatted,
      daysLeft: 2,
      isTrial: Boolean(sampleSub.isFreeTrial),
      appUrl,
    });

    const text = buildReminderEmailText({
      userName: user.name,
      subscriptionName: sampleSub.name,
      amount: sampleSub.amount,
      currency: sampleSub.currency || user.baseCurrency || 'INR',
      billingCycle: sampleSub.billingCycle || 'monthly',
      dueDateFormatted,
      daysLeft: 2,
      isTrial: Boolean(sampleSub.isFreeTrial),
      appUrl,
    });

    const result = await sendEmail({
      to: user.email,
      subject: `[Test] SubTrack Reminder: ${sampleSub.name} is due in 2 days`,
      html,
      text,
    });

    return {
      success: true,
      email: user.email,
      provider: result.provider,
      note: result.note,
    };
  },

  async getPendingReminders(userId) {
    return reminderModel.findPendingForUser(userId);
  },

  async dismissReminder(userId, reminderId) {
    return reminderModel.dismiss(userId, reminderId);
  },
};
