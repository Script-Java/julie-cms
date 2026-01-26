export const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';
export const ZOHO_CALENDAR_API_URL = process.env.ZOHO_CALENDAR_API_URL || 'https://calendar.zoho.com/api/v1';
export const ZOHO_MAIL_API_URL = process.env.ZOHO_MAIL_API_URL || 'https://mail.zoho.com/api/v1';

export interface ZohoEvent {
    title: string;
    start: Date;
    end: Date;
    location?: string;
    description?: string;
    attendees?: string[];
}

export interface ZohoTokenResponse {
    access_token: string;
    expires_in: number;
    api_domain?: string;
    token_type?: string;
    error?: string;
}
