import webPush from 'web-push';

export function configureVapid(): { publicKey: string; privateKey: string } {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_CONTACT || 'mailto:contact@example.com';

  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars are missing. Generate with: npx web-push generate-vapid-keys');
  }

  webPush.setVapidDetails(contact, publicKey, privateKey);
  return { publicKey, privateKey };
}
