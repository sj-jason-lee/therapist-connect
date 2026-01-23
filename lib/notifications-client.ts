type NotificationType =
  | 'application_submitted'
  | 'application_status'
  | 'new_application'
  | 'booking_confirmed'
  | 'shift_reminder'
  | 'credentials_verified';

interface NotificationPayload {
  type: NotificationType;
  to: string;
  [key: string]: unknown;
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

export async function notifyApplicationSubmitted(params: {
  therapistEmail: string;
  therapistName: string;
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
  organizerName: string;
}): Promise<boolean> {
  return sendNotification({
    type: 'application_submitted',
    to: params.therapistEmail,
    therapistName: params.therapistName,
    shiftTitle: params.shiftTitle,
    shiftDate: params.shiftDate,
    shiftTime: params.shiftTime,
    location: params.location,
    organizerName: params.organizerName,
  });
}

export async function notifyNewApplication(params: {
  organizerEmail: string;
  organizerName: string;
  therapistName: string;
  shiftTitle: string;
  shiftDate: string;
  message?: string;
}): Promise<boolean> {
  return sendNotification({
    type: 'new_application',
    to: params.organizerEmail,
    organizerName: params.organizerName,
    therapistName: params.therapistName,
    shiftTitle: params.shiftTitle,
    shiftDate: params.shiftDate,
    message: params.message,
  });
}

export async function notifyApplicationStatus(params: {
  therapistEmail: string;
  therapistName: string;
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
  status: 'accepted' | 'rejected';
}): Promise<boolean> {
  return sendNotification({
    type: 'application_status',
    to: params.therapistEmail,
    therapistName: params.therapistName,
    shiftTitle: params.shiftTitle,
    shiftDate: params.shiftDate,
    shiftTime: params.shiftTime,
    location: params.location,
    status: params.status,
  });
}

export async function notifyBookingConfirmed(params: {
  recipientEmail: string;
  recipientName: string;
  recipientType: 'therapist' | 'organizer';
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
  address: string;
  hourlyRate: number;
  otherPartyName: string;
}): Promise<boolean> {
  return sendNotification({
    type: 'booking_confirmed',
    to: params.recipientEmail,
    recipientName: params.recipientName,
    recipientType: params.recipientType,
    shiftTitle: params.shiftTitle,
    shiftDate: params.shiftDate,
    shiftTime: params.shiftTime,
    location: params.location,
    address: params.address,
    hourlyRate: params.hourlyRate,
    otherPartyName: params.otherPartyName,
  });
}

export async function notifyCredentialsVerified(params: {
  therapistEmail: string;
  therapistName: string;
}): Promise<boolean> {
  return sendNotification({
    type: 'credentials_verified',
    to: params.therapistEmail,
    therapistName: params.therapistName,
  });
}

export async function notifyShiftReminder(params: {
  therapistEmail: string;
  therapistName: string;
  shiftTitle: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
  address: string;
  organizerName: string;
  hoursUntil: number;
}): Promise<boolean> {
  return sendNotification({
    type: 'shift_reminder',
    to: params.therapistEmail,
    therapistName: params.therapistName,
    shiftTitle: params.shiftTitle,
    shiftDate: params.shiftDate,
    shiftTime: params.shiftTime,
    location: params.location,
    address: params.address,
    organizerName: params.organizerName,
    hoursUntil: params.hoursUntil,
  });
}
