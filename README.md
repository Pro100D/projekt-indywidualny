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

**Dane:** `POST /api/auth/register`, `POST /api/auth/login` — serwer zwraca token JWT, który front zapisuje w przeglądarce. `GET /api/auth/me` — po odświeżeniu strony front sprawdza token i pobiera imię użytkownika. Kolekcja `users` (e-mail, hash hasła, imię).

**Najtrudniejsze:** ochrona stron — niezalogowany użytkownik ma trafić na `/login`; dołączanie tokenu do każdego zapytania.

**Gotowe, gdy:**
- [x] można założyć konto i zalogować się, a błędne dane pokazują komunikat pod formularzem,
- [x] po odświeżeniu strony użytkownik nadal jest zalogowany,
- [x] „Wyloguj” usuwa token i przenosi na `/login`,
- [x] wejście na stronę aplikacji bez logowania przekierowuje na `/login`.

### 2. Adresy

**Co robi użytkownik:** dodaje, edytuje i usuwa swoje adresy, ustawia jeden jako domyślny i przełącza aktywny adres w nagłówku aplikacji.

**Widok:** strona `/addresses` — lista kart (nazwa, ulica, miasto, liczba zakupów, oznaczenie „domyślny”), formularz dodawania nad listą, przycisk „Edytuj”, który otwiera okienko z formularzem edycji, oraz przycisk „Usuń”, który otwiera okienko z potwierdzeniem. Jeśli do adresu należą zakupy, okienko ostrzega, że zostaną usunięte razem z adresem. W nagłówku aplikacji lista rozwijana z wyborem adresu.

**Dane:** `GET/POST /api/addresses`, `PUT/DELETE /api/addresses/:id`. Kolekcja `addresses` (nazwa, ulica, miasto, domyślny). Pierwszy dodany adres automatycznie staje się domyślnym, a po usunięciu adresu domyślnego jego miejsce zajmuje najstarszy z pozostałych. Lista adresów zawiera liczbę zakupów przy każdym adresie. Adres z zakupami można usunąć tylko razem z nimi (`DELETE /api/addresses/:id?withPurchases=true`) — usuwane są wtedy także przypomnienia i powiadomienia tych zakupów; bez tego parametru serwer odpowiada kodem 409. Wybrany adres jest zapamiętany w przeglądarce, a po zalogowaniu zawsze wybierany jest adres domyślny.

**Najtrudniejsze:** wybrany adres musi być wspólny dla całej aplikacji i zapamiętany po odświeżeniu; komunikat, gdy użytkownik chce usunąć adres, do którego należą zakupy.

**Gotowe, gdy:**
- [x] można dodać, edytować i usunąć adres (usunięcie z potwierdzeniem),
- [x] dokładnie jeden adres jest domyślny i to on jest wybrany po zalogowaniu,
- [x] zmiana adresu w nagłówku zmienia dane na liście zakupów i na stronie głównej,
- [x] użytkownik bez adresów widzi zachętę „Dodaj pierwszy adres”.

### 3. Zakupy — formularz dodawania i edycji

**Co robi użytkownik:** wypełnia formularz: nazwa, kategoria, data zakupu, cena i waluta, sklep, numer seryjny, data końca gwarancji, adres (domyślnie aktualnie wybrany), notatki. Zapisuje albo anuluje. Ten sam formularz służy do edycji.

**Widok:** strony `/purchases/new` i `/purchases/:id/edit` — pola formularza, komunikaty walidacji przy polach, przyciski „Zapisz” i „Anuluj”.

**Dane:** `POST /api/purchases`, `PUT /api/purchases/:id`, `GET /api/purchases/:id` (wczytanie danych do edycji). Kolekcja `purchases`. Wymagane są nazwa, data zakupu, cena i adres. Cenę można wpisać z przecinkiem (np. `1 999,99`). Waluty: PLN, EUR, USD, GBP. Przyciski „1 rok / 2 lata / 3 lata” same wyliczają koniec gwarancji od daty zakupu. Te same reguły sprawdza front (od razu, bez wysyłania) i serwer. Po zapisaniu w nagłówku wybiera się adres zakupu, żeby nowa rzecz była widoczna na liście.

**Najtrudniejsze:** walidacja (wymagane pola, cena większa od 0, koniec gwarancji nie wcześniej niż data zakupu) i jeden komponent formularza dla dodawania i edycji.

**Gotowe, gdy:**
- [x] nowy zakup po zapisaniu pojawia się na liście,
- [x] edycja otwiera formularz z wypełnionymi danymi, a zmiany widać na liście,
- [x] błędne pola są podświetlone z komunikatem i formularz się nie wysyła,
- [x] „Anuluj” wraca do listy bez zmian.

### 4. Zakupy — lista i szczegóły

**Co robi użytkownik:** przegląda zakupy z wybranego adresu, otwiera szczegóły rzeczy i usuwa zakup.

**Widok:** strona `/purchases` — tabela / karty (nazwa, kategoria, data zakupu, cena, status gwarancji); strona `/purchases/:id` — wszystkie dane rzeczy, dokumenty, przyciski „Edytuj” i „Usuń”. Pusta lista pokazuje „Brak zakupów” i przycisk „Dodaj zakup”.

**Dane:** `GET /api/purchases?addressId=...`, `GET /api/purchases/:id`, `DELETE /api/purchases/:id` (razem z zakupem usuwane są jego przypomnienia i powiadomienia). Status gwarancji liczy front: aktywna, kończy się (30 dni lub mniej), wygasła, brak gwarancji. Strona główna pokazuje 5 ostatnio dodanych zakupów z wybranego adresu.

**Najtrudniejsze:** obsługa stanów (ładowanie, pusta lista, błąd), odświeżenie listy po usunięciu bez przeładowania strony, wygląd na telefonie.

**Gotowe, gdy:**
- [x] lista pokazuje tylko zakupy z wybranego adresu,
- [x] kliknięcie zakupu otwiera jego szczegóły,
- [x] usunięcie wymaga potwierdzenia, a zakup znika z listy bez przeładowania strony,
- [x] widoczne są stany: ładowanie, pusta lista i błąd.

### 5. Zakupy — filtrowanie i wyszukiwanie

**Co robi użytkownik:** ustawia okres od–do, wybiera kategorię, wpisuje nazwę w wyszukiwarkę, sortuje (po dacie lub cenie) i czyści filtry.

**Widok:** pasek filtrów nad listą zakupów — dwa pola daty, lista kategorii, pole wyszukiwania, przycisk „Wyczyść” i licznik znalezionych rzeczy.

**Dane:** `GET /api/purchases?addressId=&from=&to=&category=&search=&sort=`; filtry zapisane w adresie strony (query string). Wyszukiwarka szuka w nazwie, sklepie i numerze seryjnym, bez względu na wielkość liter. Sortowanie: najnowsze, najstarsze, najdroższe, najtańsze, nazwa A–Z. Odpowiedź zawiera też liczbę wszystkich zakupów adresu i listę kategorii do filtra.

**Najtrudniejsze:** kilka filtrów działających jednocześnie, zachowanie filtrów po odświeżeniu strony, wyszukiwanie dopiero po przerwie w pisaniu (debounce).

**Gotowe, gdy:**
- [x] filtr dat pokazuje tylko zakupy z wybranego okresu,
- [x] filtr kategorii i wyszukiwarka działają razem z filtrem dat,
- [x] po odświeżeniu strony filtry zostają,
- [x] „Wyczyść” przywraca pełną listę, a brak wyników pokazuje komunikat.

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

**Dane:** pole `purchases.warrantyUntil`; liczba dni liczona na froncie; `GET /api/warranties?status=active|expiring|expired&addressId=&today=`. Serwer zwraca rzeczy z wybranej grupy (kończące się — od najbliższego końca, wygasłe — od ostatnio wygasłej) i liczby rzeczy w każdej grupie do zakładek. „Dzisiaj” wysyła przeglądarka (`today=RRRR-MM-DD`), bo serwer działa w innej strefie czasowej niż użytkownik. Kończąca się gwarancja to taka, która kończy się dziś albo w ciągu 30 dni. Na stronie można przełączyć widok na wszystkie adresy, a pasek przy każdej rzeczy pokazuje, jaka część okresu gwarancji już minęła.

**Najtrudniejsze:** poprawne liczenie dni (strefa czasowa, „dzisiaj”), jeden wspólny komponent znacznika używany w kilku miejscach.

**Gotowe, gdy:**
- [x] każdy zakup z datą gwarancji ma znacznik z poprawną liczbą dni i kolorem,
- [x] zakup bez daty gwarancji ma szary znacznik,
- [x] strona `/warranties` dzieli rzeczy na trzy grupy,
- [x] po zmianie daty gwarancji w edycji znacznik od razu się zmienia.

### 8. Powiadomienia

**Co robi użytkownik:** widzi dzwonek z liczbą nowych powiadomień, otwiera ich listę, przechodzi do rzeczy i oznacza powiadomienia jako przeczytane.

**Widok:** ikona dzwonka z licznikiem w nagłówku, strona `/notifications` z listą, baner na stronie głównej „X rzeczy z kończącą się gwarancją”.

**Dane:** `GET /api/notifications`, `PUT /api/notifications/:id`, `PUT /api/notifications/read-all`. Kolekcja `notifications` — serwer raz dziennie (i zaraz po starcie) tworzy powiadomienia 30, 7 i 1 dzień przed końcem gwarancji oraz po jej wygaśnięciu. Dodatkowo sprawdza gwarancje danego użytkownika po zapisaniu zakupu i przy pobieraniu powiadomień (`GET /api/notifications/unread-count`), więc powiadomienie pojawia się od razu, nawet jeśli serwer był wyłączony o zwykłej porze. Jeśli rzecz trafi do aplikacji już po progu (np. 5 dni przed końcem), powstaje tylko powiadomienie dla najbliższego progu. Powiadomienie o wygaśnięciu powstaje tylko dla gwarancji, które wygasły najwyżej 7 dni temu. Po zmianie daty gwarancji stare powiadomienia tej rzeczy są usuwane. Licznik na dzwonku odświeża się przy każdej zmianie strony, po powrocie do karty przeglądarki i co minutę. Baner na stronie głównej liczy rzeczy z wybranego adresu, które kończą się w ciągu 30 dni.

**Najtrudniejsze:** odświeżanie licznika bez przeładowania strony i brak powtarzających się powiadomień — każde powiadomienie o gwarancji ma w bazie unikalny klucz (zakup + próg + data końca gwarancji), więc nawet kilka sprawdzeń tego samego dnia nie tworzy duplikatów.

**Gotowe, gdy:**
- [x] licznik na dzwonku pokazuje liczbę nieprzeczytanych powiadomień,
- [x] kliknięcie powiadomienia otwiera szczegóły rzeczy i oznacza je jako przeczytane,
- [x] „Oznacz wszystkie jako przeczytane” zeruje licznik,
- [x] dla rzeczy z gwarancją kończącą się za 30, 7 i 1 dzień pojawia się dokładnie jedno powiadomienie na każdy próg.

### 9. Przypomnienia

**Co robi użytkownik:** dodaje do rzeczy własne terminy (serwis, wymiana filtra, ubezpieczenie), oznacza je jako wykonane, edytuje i usuwa.

**Widok:** sekcja „Przypomnienia” w szczegółach zakupu (lista + krótki formularz: tytuł, typ, data); lista najbliższych przypomnień na stronie głównej.

**Dane:** `GET/POST /api/reminders`, `PUT/DELETE /api/reminders/:id`. Kolekcja `reminders` (zakup, typ, tytuł, termin, wykonane). Lista przyjmuje `?purchaseId=` (szczegóły zakupu) albo `?addressId=&status=upcoming&limit=5` (strona główna — tylko niewykonane z wybranego adresu, od najwcześniejszego terminu). Typy: serwis, wymiana filtra, ubezpieczenie, inne. Kolory: czerwony — po terminie, pomarańczowy — dziś, żółty — w ciągu 7 dni. Wykonane przypomnienia są zwinięte pod listą. Edycja odbywa się w okienku. Dzień przed terminem i po jego minięciu (do 7 dni) serwer tworzy powiadomienie, które trafia do dzwonka; po oznaczeniu przypomnienia jako wykonane jego powiadomienie jest oznaczane jako przeczytane, a po zmianie terminu albo usunięciu przypomnienia stare powiadomienie znika.

**Najtrudniejsze:** sortowanie po terminie, wyróżnienie przeterminowanych, powiązanie z powiadomieniami.

**Gotowe, gdy:**
- [x] można dodać przypomnienie do rzeczy i widać je w jej szczegółach,
- [x] najbliższe przypomnienia widać na stronie głównej, posortowane po dacie,
- [x] przypomnienie można oznaczyć jako wykonane, edytować i usunąć,
- [x] przeterminowane przypomnienia są wyróżnione kolorem.

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
  src/auth/             stan logowania, ochrona stron
  src/addresses/        wybrany adres (wspólny dla całej aplikacji), pola formularza adresu
  src/purchases/        formatowanie dat i cen, status gwarancji
  src/notifications/    licznik nieprzeczytanych powiadomień i dzwonek w nagłówku
  src/components/       wspólne komponenty (nagłówek, pole formularza, okienko modalne)
  src/pages/            ekrany aplikacji (po jednym pliku na ekran)
server/                 backend — Node.js + Express
  src/config/           połączenie z MongoDB
  src/jobs/             codzienne sprawdzanie gwarancji i tworzenie powiadomień
  src/middleware/       sprawdzanie tokenu JWT, obsługa błędów
  src/models/           modele Mongoose (User, Address, Purchase, Notification, Reminder)
  src/routes/           endpointy API (po jednym pliku na moduł)
```

## Bezpieczeństwo

- Sekrety (`JWT_SECRET`, `MONGODB_URI`, klucze AWS) są **tylko** w pliku `server/.env`, który jest w `.gitignore` i nigdy nie trafia do repozytorium.
- W repozytorium jest tylko `server/.env.example` z pustymi wartościami.
- Frontend nie zawiera żadnych kluczy — z MongoDB i AWS S3 łączy się wyłącznie serwer.
- Hasła nie są zapisywane w bazie wprost — zapisywany jest tylko ich hash (bcrypt). Przy błędnym logowaniu serwer zawsze zwraca ten sam komunikat, więc nie da się sprawdzić, czy konto z danym e-mailem istnieje.

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
