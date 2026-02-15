import { redirect } from 'next/navigation';

/**
 * Homepage - redirects to /quote
 * 
 * The main pages of this app are:
 * - /quote       - Online quote page
 * - /review      - Customer review page
 * - /thank-you   - Thank you page
 * - /settings    - Admin settings (requires login)
 */
export default function Home() {
  redirect('/quote');
}
