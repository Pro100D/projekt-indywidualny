# Projekt indywidualny: HomeVault

## Autor

| Imię i nazwisko | GitHub |
|---|---|
| Danyl Takiullin | @Pro100D |

## Opis projektu

HomeVault to aplikacja internetowa, w której użytkownik zapisuje rzeczy, które kupił — na przykład laptop, telefon, pralkę czy słuchawki.
Przy każdej rzeczy można wpisać datę zakupu, cenę, sklep oraz datę końca gwarancji, a także dodać dokumenty: zdjęcie paragonu, fakturę PDF lub kartę gwarancyjną. Użytkownik może mieć kilka adresów (np. mieszkanie w mieście i dom rodzinny). Przy dodawaniu zakupu wybiera, do którego adresu należy dana rzecz, a potem może przeglądać zakupy osobno dla każdego adresu i dla wybranego okresu.

## Dlaczego taka aplikacja

Paragony często giną albo blakną, faktury są rozrzucone po skrzynce e-mail, a daty końca gwarancji trudno zapamiętać. HomeVault zbiera wszystkie te informacje w jednym miejscu, a pliki trzyma w chmurze, więc są dostępne z każdego urządzenia.

## Technologia

JavaScript, React (Vite, React Router), Node.js + Express, MongoDB Atlas, AWS S3, JWT, Git + GitHub.

## Funkcjonalności

| # | Funkcja |
|---|---|
| 1 | Konto użytkownika |
| 2 | Adresy |
| 3 | Zakupy — formularz dodawania i edycji |
| 4 | Zakupy — lista i szczegóły |
| 5 | Zakupy — filtrowanie i wyszukiwanie |
| 6 | Dokumenty w chmurze |
| 7 | Gwarancje |
| 8 | Powiadomienia |
| 9 | Przypomnienia |
| 10 | Statystyki |

### 1. Konto użytkownika

**Co robi użytkownik:** zakłada konto (imię, e-mail, hasło), loguje się i wylogowuje. Po odświeżeniu strony nadal jest zalogowany.

**Widok:** strony `/login` i `/register` z formularzem, komunikatami błędów pod polami (np. „Nieprawidłowy e-mail lub hasło”) i linkiem między stronami. Po zalogowaniu w nagłówku widać imię użytkownika i przycisk „Wyloguj”.

**Dane:** `POST /api/auth/register`, `POST /api/auth/login` — serwer zwraca token JWT, który front zapisuje w przeglądarce. Kolekcja `users` (e-mail, hash hasła, imię).

**Najtrudniejsze:** ochrona stron — niezalogowany użytkownik ma trafić na `/login`; dołączanie tokenu do każdego zapytania.

**Gotowe, gdy:**
- [ ] można założyć konto i zalogować się, a błędne dane pokazują komunikat pod formularzem,
- [ ] po odświeżeniu strony użytkownik nadal jest zalogowany,
- [ ] „Wyloguj” usuwa token i przenosi na `/login`,
- [ ] wejście na stronę aplikacji bez logowania przekierowuje na `/login`.

### 2. Adresy

**Co robi użytkownik:** dodaje, edytuje i usuwa swoje adresy, ustawia jeden jako domyślny i przełącza aktywny adres w nagłówku aplikacji.

**Widok:** strona `/addresses` — lista kart (nazwa, ulica, miasto, oznaczenie „domyślny”), formularz dodawania / edycji, przycisk „Usuń” z potwierdzeniem. W nagłówku aplikacji lista rozwijana z wyborem adresu.

**Dane:** `GET/POST /api/addresses`, `PUT/DELETE /api/addresses/:id`. Kolekcja `addresses` (nazwa, ulica, miasto, domyślny).

**Najtrudniejsze:** wybrany adres musi być wspólny dla całej aplikacji i zapamiętany po odświeżeniu; komunikat, gdy użytkownik chce usunąć adres, do którego należą zakupy.

**Gotowe, gdy:**
- [ ] można dodać, edytować i usunąć adres (usunięcie z potwierdzeniem),
- [ ] dokładnie jeden adres jest domyślny i to on jest wybrany po zalogowaniu,
- [ ] zmiana adresu w nagłówku zmienia dane na liście zakupów i na stronie głównej,
- [ ] użytkownik bez adresów widzi zachętę „Dodaj pierwszy adres”.

### 3. Zakupy — formularz dodawania i edycji

**Co robi użytkownik:** wypełnia formularz: nazwa, kategoria, data zakupu, cena i waluta, sklep, numer seryjny, data końca gwarancji, adres (domyślnie aktualnie wybrany), notatki. Zapisuje albo anuluje. Ten sam formularz służy do edycji.

**Widok:** strony `/purchases/new` i `/purchases/:id/edit` — pola formularza, komunikaty walidacji przy polach, przyciski „Zapisz” i „Anuluj”.

**Dane:** `POST /api/purchases`, `PUT /api/purchases/:id`, `GET /api/purchases/:id` (wczytanie danych do edycji). Kolekcja `purchases`.

**Najtrudniejsze:** walidacja (wymagane pola, cena większa od 0, koniec gwarancji nie wcześniej niż data zakupu) i jeden komponent formularza dla dodawania i edycji.

**Gotowe, gdy:**
- [ ] nowy zakup po zapisaniu pojawia się na liście,
- [ ] edycja otwiera formularz z wypełnionymi danymi, a zmiany widać na liście,
- [ ] błędne pola są podświetlone z komunikatem i formularz się nie wysyła,
- [ ] „Anuluj” wraca do listy bez zmian.

### 4. Zakupy — lista i szczegóły

**Co robi użytkownik:** przegląda zakupy z wybranego adresu, otwiera szczegóły rzeczy i usuwa zakup.

**Widok:** strona `/purchases` — tabela / karty (nazwa, kategoria, data zakupu, cena, status gwarancji); strona `/purchases/:id` — wszystkie dane rzeczy, dokumenty, przyciski „Edytuj” i „Usuń”. Pusta lista pokazuje „Brak zakupów” i przycisk „Dodaj zakup”.

**Dane:** `GET /api/purchases?addressId=...`, `GET /api/purchases/:id`, `DELETE /api/purchases/:id`.

**Najtrudniejsze:** obsługa stanów (ładowanie, pusta lista, błąd), odświeżenie listy po usunięciu bez przeładowania strony, wygląd na telefonie.

**Gotowe, gdy:**
- [ ] lista pokazuje tylko zakupy z wybranego adresu,
- [ ] kliknięcie zakupu otwiera jego szczegóły,
- [ ] usunięcie wymaga potwierdzenia, a zakup znika z listy bez przeładowania strony,
- [ ] widoczne są stany: ładowanie, pusta lista i błąd.

### 5. Zakupy — filtrowanie i wyszukiwanie

**Co robi użytkownik:** ustawia okres od–do, wybiera kategorię, wpisuje nazwę w wyszukiwarkę, sortuje (po dacie lub cenie) i czyści filtry.

**Widok:** pasek filtrów nad listą zakupów — dwa pola daty, lista kategorii, pole wyszukiwania, przycisk „Wyczyść” i licznik znalezionych rzeczy.

**Dane:** `GET /api/purchases?addressId=&from=&to=&category=&search=&sort=`; filtry zapisane w adresie strony (query string).

**Najtrudniejsze:** kilka filtrów działających jednocześnie, zachowanie filtrów po odświeżeniu strony, wyszukiwanie dopiero po przerwie w pisaniu (debounce).

**Gotowe, gdy:**
- [ ] filtr dat pokazuje tylko zakupy z wybranego okresu,
- [ ] filtr kategorii i wyszukiwarka działają razem z filtrem dat,
- [ ] po odświeżeniu strony filtry zostają,
- [ ] „Wyczyść” przywraca pełną listę, a brak wyników pokazuje komunikat.

### 6. Dokumenty w chmurze

**Co robi użytkownik:** dodaje do zakupu pliki (paragon, faktura, karta gwarancyjna, zdjęcie) — wybiera je z dysku albo przeciąga; ogląda, pobiera i usuwa.

**Widok:** sekcja „Dokumenty” w szczegółach zakupu — pole „przeciągnij i upuść”, pasek postępu, lista plików z miniaturą lub ikoną PDF, przyciski „Otwórz”, „Pobierz”, „Usuń”.

**Dane:** `POST /api/purchases/:id/documents`, `GET /api/purchases/:id/documents/:docId`, `DELETE /api/purchases/:id/documents/:docId`. Pliki leżą w AWS S3, w bazie (`purchases.documents`) tylko nazwa, typ i link.

**Najtrudniejsze:** upload z paskiem postępu, sprawdzenie typu i rozmiaru pliku (PDF/JPG/PNG, maks. 10 MB) przed wysłaniem, podgląd zdjęć i PDF.

**Gotowe, gdy:**
- [ ] plik PDF, JPG lub PNG można dodać i po wysłaniu widać go na liście,
- [ ] zły typ albo za duży plik pokazuje komunikat i nie jest wysyłany,
- [ ] zdjęcie i PDF otwierają się w podglądzie i można je pobrać,
- [ ] usunięty plik znika z listy (i z AWS S3).

### 7. Gwarancje

**Co robi użytkownik:** przy każdej rzeczy widzi, ile dni zostało do końca gwarancji i jaki jest jej status; ogląda zestawienie wszystkich gwarancji.

**Widok:** kolorowy znacznik na liście i w szczegółach zakupu: zielony „jeszcze N dni”, żółty „kończy się za N dni” (30 dni lub mniej), czerwony „wygasła”, szary „brak gwarancji”. Strona `/warranties` z zakładkami: aktywne / kończące się / wygasłe.

**Dane:** pole `purchases.warrantyUntil`; liczba dni liczona na froncie; `GET /api/warranties?status=...`.

**Najtrudniejsze:** poprawne liczenie dni (strefa czasowa, „dzisiaj”), jeden wspólny komponent znacznika używany w kilku miejscach.

**Gotowe, gdy:**
- [ ] każdy zakup z datą gwarancji ma znacznik z poprawną liczbą dni i kolorem,
- [ ] zakup bez daty gwarancji ma szary znacznik,
- [ ] strona `/warranties` dzieli rzeczy na trzy grupy,
- [ ] po zmianie daty gwarancji w edycji znacznik od razu się zmienia.

### 8. Powiadomienia

**Co robi użytkownik:** widzi dzwonek z liczbą nowych powiadomień, otwiera ich listę, przechodzi do rzeczy i oznacza powiadomienia jako przeczytane.

**Widok:** ikona dzwonka z licznikiem w nagłówku, strona `/notifications` z listą, baner na stronie głównej „X rzeczy z kończącą się gwarancją”.

**Dane:** `GET /api/notifications`, `PUT /api/notifications/:id`, `PUT /api/notifications/read-all`. Kolekcja `notifications` — serwer raz dziennie tworzy powiadomienia 30, 7 i 1 dzień przed końcem gwarancji oraz po jej wygaśnięciu.

**Najtrudniejsze:** odświeżanie licznika bez przeładowania strony i brak powtarzających się powiadomień.

**Gotowe, gdy:**
- [ ] licznik na dzwonku pokazuje liczbę nieprzeczytanych powiadomień,
- [ ] kliknięcie powiadomienia otwiera szczegóły rzeczy i oznacza je jako przeczytane,
- [ ] „Oznacz wszystkie jako przeczytane” zeruje licznik,
- [ ] dla rzeczy z gwarancją kończącą się za 30, 7 i 1 dzień pojawia się dokładnie jedno powiadomienie na każdy próg.

### 9. Przypomnienia

**Co robi użytkownik:** dodaje do rzeczy własne terminy (serwis, wymiana filtra, ubezpieczenie), oznacza je jako wykonane, edytuje i usuwa.

**Widok:** sekcja „Przypomnienia” w szczegółach zakupu (lista + krótki formularz: tytuł, typ, data); lista najbliższych przypomnień na stronie głównej.

**Dane:** `GET/POST /api/reminders`, `PUT/DELETE /api/reminders/:id`. Kolekcja `reminders` (zakup, typ, tytuł, termin, wykonane).

**Najtrudniejsze:** sortowanie po terminie, wyróżnienie przeterminowanych, powiązanie z powiadomieniami.

**Gotowe, gdy:**
- [ ] można dodać przypomnienie do rzeczy i widać je w jej szczegółach,
- [ ] najbliższe przypomnienia widać na stronie głównej, posortowane po dacie,
- [ ] przypomnienie można oznaczyć jako wykonane, edytować i usunąć,
- [ ] przeterminowane przypomnienia są wyróżnione kolorem.

### 10. Statystyki

**Co robi użytkownik:** wybiera adres i okres i sprawdza, ile wydał, ile rzeczy kupił i na jakie kategorie.

**Widok:** strona `/stats` — kafelki (suma wydatków, liczba rzeczy, kończące się gwarancje), wykres podziału na kategorie, wybór okresu.

**Dane:** `GET /api/stats/summary?addressId=&from=&to=` — suma, liczba rzeczy, podział na kategorie.

**Najtrudniejsze:** wykres (np. biblioteka Recharts) i różne waluty — sumy osobno dla każdej waluty.

**Gotowe, gdy:**
- [ ] kafelki pokazują poprawną sumę i liczbę rzeczy dla wybranego adresu i okresu,
- [ ] wykres pokazuje podział wydatków na kategorie,
- [ ] zmiana adresu lub okresu odświeża dane,
- [ ] przy braku zakupów widać komunikat zamiast pustego wykresu.

## Architektura

### 1. Ekrany aplikacji

- Logowanie / rejestracja — formularz z e-mailem i hasłem.
- Strona główna — wybór adresu, ostatnio dodane rzeczy, gwarancje, które niedługo się kończą, najbliższe przypomnienia.
- Lista zakupów — rzeczy z wybranego adresu, filtr dat (od–do), wyszukiwarka.
- Szczegóły zakupu — dane rzeczy, dokumenty, przypomnienia.
- Dodawanie / edycja zakupu — formularz z danymi rzeczy i datą gwarancji.
- Adresy — lista adresów użytkownika, dodawanie, edycja i usuwanie.
- Gwarancje — zestawienie aktywnych, kończących się i wygasłych gwarancji.
- Powiadomienia — lista powiadomień o kończących się gwarancjach.
- Statystyki — wydatki dla adresu i okresu, podział na kategorie.

### 2. Baza danych

- `users` — użytkownicy (e-mail, hasło, imię).
- `addresses` — adresy użytkowników (nazwa, ulica, miasto).
- `purchases` — zakupy (nazwa, cena, data zakupu, koniec gwarancji, adres i lista dokumentów).
- `notifications` — powiadomienia o kończących się gwarancjach.
- `reminders` — własne przypomnienia użytkownika związane z rzeczą.
- Powiązania: jeden użytkownik może mieć wiele adresów i wiele zakupów, a do jednego adresu może należeć wiele zakupów. Same pliki (paragony, faktury) nie są w bazie, w bazie zapisany jest tylko link do pliku w AWS S3.

### 3. Struktura repozytorium

```
client/                 frontend — React + Vite
  src/api/              wywołania API (fetch + token)
  src/components/       wspólne komponenty (nagłówek, układ strony)
  src/pages/            ekrany aplikacji (po jednym pliku na ekran)
server/                 backend — Node.js + Express
  src/config/           połączenie z MongoDB
  src/middleware/       sprawdzanie tokenu JWT, obsługa błędów
  src/models/           modele Mongoose (User, Address, Purchase, Notification, Reminder)
  src/routes/           endpointy API (po jednym pliku na moduł)
```

## Bezpieczeństwo

- Sekrety (`JWT_SECRET`, `MONGODB_URI`, klucze AWS) są **tylko** w pliku `server/.env`, który jest w `.gitignore` i nigdy nie trafia do repozytorium.
- W repozytorium jest tylko `server/.env.example` z pustymi wartościami.
- Frontend nie zawiera żadnych kluczy — z MongoDB i AWS S3 łączy się wyłącznie serwer.

## Uruchomienie

Wymagany Node.js 20 lub nowszy.

**Serwer (API):**

```bash
cd server
npm install
cp .env.example .env    # uzupełnić wartości w .env
npm run dev             # http://localhost:5000/api/health
```

**Frontend:**

```bash
cd client
npm install
npm run dev             # http://localhost:5173
```

Frontend przekierowuje zapytania `/api` do serwera na porcie 5000, więc oba procesy trzeba uruchomić jednocześnie (w dwóch terminalach).

## Wdrożenie

Plan (do uzupełnienia w ostatnim etapie): frontend — Vercel lub Netlify, serwer — Render, baza danych — MongoDB Atlas, pliki — AWS S3. Zmienne środowiskowe ustawiane w panelu hostingu, nie w kodzie.
