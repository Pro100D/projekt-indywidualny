import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section>
      <h1>Nie znaleziono strony</h1>
      <Link to="/">Wróć na stronę główną</Link>
    </section>
  );
}
