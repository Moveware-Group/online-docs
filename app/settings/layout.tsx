import { FloatingChatWidget } from '@/lib/components/chat/floating-chat-widget';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingChatWidget />
    </>
  );
}
