import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


class EmailService:
    def __init__(self):
        # Email configuration - should be in environment variables
        self.smtp_server = getattr(settings, 'SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_user = getattr(settings, 'SMTP_USER', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'FROM_EMAIL', 'noreply@logitrack.com')
        self.enabled = getattr(settings, 'EMAIL_ENABLED', False)

    def send_tracking_code(self, to_email: str, order_id: int, customer_name: str, tracking_url: str) -> bool:
        """Send order tracking code to customer email."""
        if not self.enabled:
            print(f"[EMAIL DISABLED] Would send tracking code to {to_email} for order {order_id}")
            return True  # Return True in dev mode

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Your Order Tracking Code - #{order_id}'
            msg['From'] = self.from_email
            msg['To'] = to_email

            # Create HTML email
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
                    .tracking-code {{ background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }}
                    .code {{ font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; font-family: monospace; }}
                    .button {{ display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                    .footer {{ background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚚 LogiTrack</h1>
                        <p>Your Order Tracking Information</p>
                    </div>
                    <div class="content">
                        <p>Hello {customer_name},</p>
                        <p>Thank you for your order! You can track your shipment in real-time using the tracking code below.</p>
                        
                        <div class="tracking-code">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your Tracking Code:</p>
                            <div class="code">{order_id}</div>
                        </div>
                        
                        <p>Click the button below to track your shipment:</p>
                        <a href="{tracking_url}" class="button">Track My Order</a>
                        
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            Or copy and paste this link into your browser:<br>
                            <a href="{tracking_url}" style="color: #2563eb; word-break: break-all;">{tracking_url}</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2024 LogiTrack TMS. All rights reserved.</p>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # Create plain text version
            text_content = f"""
            LogiTrack - Order Tracking Code
            
            Hello {customer_name},
            
            Thank you for your order! You can track your shipment using the tracking code below.
            
            Your Tracking Code: {order_id}
            
            Track your order: {tracking_url}
            
            © 2024 LogiTrack TMS. All rights reserved.
            """

            # Attach both versions
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            print(f"Email sent successfully to {to_email} for order {order_id}")
            return True

        except Exception as e:
            print(f"Error sending email to {to_email}: {str(e)}")
            return False


email_service = EmailService()

