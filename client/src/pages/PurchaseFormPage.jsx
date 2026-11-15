import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAddresses } from '../addresses/AddressContext.jsx';
import FormField from '../components/FormField.jsx';
import { CURRENCIES, DEFAULT_CATEGORIES, toInputDate, todayInputDate } from '../purchases/format.js';

const EMPTY = {
  name: '',
  category: '',
  purchaseDate: todayInputDate(),
  price: '',
  currency: 'PLN',
  store: '',
  serialNumber: '',
  warrantyUntil: '',
  addressId: '',
  notes: '',
};

const FIELD_ORDER = ['name', 'purchaseDate', 'price', 'currency', 'addressId', 'warrantyUntil'];

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Podaj nazwę rzeczy';
  if (!values.purchaseDate) errors.purchaseDate = 'Podaj datę zakupu';
  const price = Number(String(values.price).replace(/\s/g, '').replace(',', '.'));
  if (String(values.price).trim() === '') errors.price = 'Podaj cenę';
  else if (!Number.isFinite(price)) errors.price = 'Wpisz cenę liczbą, np. 199,99';
  else if (price <= 0) errors.price = 'Cena musi być większa od 0';
  if (!values.addressId) errors.addressId = 'Wybierz adres';
  if (values.warrantyUntil && values.purchaseDate && values.warrantyUntil < values.purchaseDate) {
    errors.warrantyUntil = 'Koniec gwarancji nie może być wcześniej niż data zakupu';
  }
  return errors;
}

function addYears(day, years) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y + years, m - 1, d));
  if (date.getUTCMonth() !== m - 1) date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

export default function PurchaseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addresses, activeAddress, selectAddress, reload: reloadAddresses, loading: addressesLoading } = useAddresses();
  const formRef = useRef(null);

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    api('/purchases?limit=1')
      .then((data) => setCategories([...new Set([...DEFAULT_CATEGORIES, ...data.categories])].sort((a, b) => a.localeCompare(b, 'pl'))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api(`/purchases/${id}`)
      .then(({ purchase }) => {
        setValues({
          name: purchase.name,
          category: purchase.category || '',
          purchaseDate: toInputDate(purchase.purchaseDate),
          price: purchase.price == null ? '' : String(purchase.price).replace('.', ','),
          currency: purchase.currency || 'PLN',
          store: purchase.store || '',
          serialNumber: purchase.serialNumber || '',
          warrantyUntil: toInputDate(purchase.warrantyUntil),
          addressId: purchase.addressId,
          notes: purchase.notes || '',
        });
        setLoadError('');
      })
      .catch((err) => setLoadError(err.status === 404 ? 'Nie znaleziono tego zakupu.' : err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit && !values.addressId && activeAddress) {
      setValues((v) => ({ ...v, addressId: activeAddress._id }));
    }
  }, [isEdit, values.addressId, activeAddress]);

  function onChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  }

  function setWarrantyYears(years) {
    if (!values.purchaseDate) return;
    setValues((v) => ({ ...v, warrantyUntil: addYears(v.purchaseDate, years) }));
    setErrors((er) => ({ ...er, warrantyUntil: undefined }));
  }

  function focusFirstError(found) {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    const found = validate(values);
    if (Object.keys(found).length) {
      setErrors(found);
      focusFirstError(found);
      return;
    }

    setSaving(true);
    try {
      const body = { ...values, price: String(values.price).replace(/\s/g, '').replace(',', '.') };
      const { purchase } = isEdit
        ? await api(`/purchases/${id}`, { method: 'PUT', body })
        : await api('/purchases', { method: 'POST', body });
      await reloadAddresses();
      selectAddress(purchase.addressId);
      const flash = { type: 'success', text: isEdit ? 'Zapisano zmiany' : `Dodano „${purchase.name}”` };
      navigate(isEdit ? `/purchases/${id}` : '/purchases', { state: { flash } });
    } catch (err) {
      if (Object.keys(err.fields).length) {
        setErrors(err.fields);
        focusFirstError(err.fields);
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const backTo = isEdit ? `/purchases/${id}` : '/purchases';

  if (loading || addressesLoading) return <p className="loading">Ładowanie…</p>;

  if (loadError) {
    return (
      <section>
        <h1>Edytuj zakup</h1>
        <p className="form-error">{loadError}</p>
        <Link to="/purchases">← Wróć do listy zakupów</Link>
      </section>
    );
  }

  if (addresses.length === 0) {
    return (
      <section>
        <h1>Dodaj zakup</h1>
        <p className="empty">
          Zakup musi należeć do adresu, a nie masz jeszcze żadnego. <Link to="/addresses">Dodaj pierwszy adres</Link>.
        </p>
      </section>
    );
  }

  return (
    <section>
      <Link to={backTo} className="back-link">← {isEdit ? 'Wróć do zakupu' : 'Wróć do listy'}</Link>
      <h1>{isEdit ? 'Edytuj zakup' : 'Dodaj zakup'}</h1>

      <form ref={formRef} className="form card purchase-form" onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>Rzecz</legend>
          <FormField label="Nazwa *" name="name" placeholder="np. Pralka Bosch Serie 6" autoFocus={!isEdit}
            value={values.name} onChange={onChange} error={errors.name} />
          <div className="form-row">
            <FormField label="Kategoria" name="category" list="category-list" placeholder="np. AGD"
              value={values.category} onChange={onChange} />
            <FormField label="Data zakupu *" name="purchaseDate" type="date" max={todayInputDate()}
              value={values.purchaseDate} onChange={onChange} error={errors.purchaseDate} />
          </div>
          <datalist id="category-list">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <div className="form-row price-row">
            <FormField label="Cena *" name="price" inputMode="decimal" autoComplete="off" placeholder="0,00"
              value={values.price} onChange={onChange} error={errors.price} />
            <FormField label="Waluta" name="currency" as="select"
              value={values.currency} onChange={onChange} error={errors.currency}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FormField>
          </div>
        </fieldset>

        <fieldset>
          <legend>Gdzie i skąd</legend>
          <FormField label="Adres *" name="addressId" as="select"
            value={values.addressId} onChange={onChange} error={errors.addressId}>
            <option value="" disabled>Wybierz adres</option>
            {addresses.map((a) => <option key={a._id} value={a._id}>{a.label}</option>)}
          </FormField>
          <div className="form-row">
            <FormField label="Sklep" name="store" placeholder="np. Media Expert"
              value={values.store} onChange={onChange} />
            <FormField label="Numer seryjny" name="serialNumber"
              value={values.serialNumber} onChange={onChange} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Gwarancja</legend>
          <FormField label="Koniec gwarancji" name="warrantyUntil" type="date" min={values.purchaseDate || undefined}
            hint="Zostaw puste, jeśli rzecz nie ma gwarancji."
            value={values.warrantyUntil} onChange={onChange} error={errors.warrantyUntil} />
          <div className="quick-buttons">
            <span>Szybko:</span>
            <button type="button" className="btn-small btn-secondary" onClick={() => setWarrantyYears(1)}>1 rok</button>
            <button type="button" className="btn-small btn-secondary" onClick={() => setWarrantyYears(2)}>2 lata</button>
            <button type="button" className="btn-small btn-secondary" onClick={() => setWarrantyYears(3)}>3 lata</button>
            {values.warrantyUntil && (
              <button type="button" className="btn-small btn-danger"
                onClick={() => setValues((v) => ({ ...v, warrantyUntil: '' }))}>Bez gwarancji</button>
            )}
          </div>
        </fieldset>

        <FormField label="Notatki" name="notes" as="textarea" rows={3} placeholder="np. kolor, gdzie stoi, uwagi"
          value={values.notes} onChange={onChange} />

        {formError && <p className="form-error" role="alert">{formError}</p>}

        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(backTo)} disabled={saving}>
            Anuluj
          </button>
        </div>
      </form>
    </section>
  );
}
