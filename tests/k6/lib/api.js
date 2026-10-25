import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { API } from './config.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const PASSWORD = 'Str0ng!Passw0rd';

const params = (token, name) => {
  const headers = { ...JSON_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { headers, tags: { name } }; // `name` tag keeps metric cardinality low (no ids in labels)
};
const json = (res, path) => { try { return res.json(path); } catch (_) { return undefined; } };
const rand = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;

export function register() {
  const id = rand();
  const user = {
    email: `k6-${id}@example.com`, username: `u${id}`.slice(0, 20), firstName: 'K', lastName: 'Six',
    password: PASSWORD, passwordConfirm: PASSWORD,
  };
  const res = http.post(`${API}/auth/register`, JSON.stringify(user), params(null, 'POST /auth/register'));
  if (res.status !== 200) throw new Error(`register failed: ${res.status} ${res.body} (apply tests/docker-compose.tests.yml)`);
  return user;
}

export function login(user) {
  const res = http.post(`${API}/auth/login`, JSON.stringify({ email: user.email, password: user.password }), params(null, 'POST /auth/login'));
  return { res, token: json(res, 'accessToken') };
}

export const customerBody = () => ({
  name: `Customer ${rand()}`, email: `cust-${rand()}@example.com`, phoneNumber: '+254712345678',
  vatTinNo: 1234, address: '1 Main St', city: 'Nairobi', country: 'Kenya',
});

export const documentBody = (customer) => ({
  customer, documentType: ['Invoice', 'Receipt', 'Quotation'][Math.floor(Math.random() * 3)],
  dueDate: new Date(Date.now() + 7 * 864e5).toISOString(), currency: 'USD', status: 'Not Paid',
  billingItems: [{ itemName: 'Load test item', unitPrice: 100, quantity: 2, discount: 0 }],
  subTotal: 200, salesTax: 20, rates: 10, total: 220, paymentRecords: [],
});

/** Runs once: creates the account all VUs share (bcrypt on every login would make the test measure bcrypt). */
export function bootstrap() {
  const user = register();
  const { token } = login(user);
  if (!token) throw new Error('login failed in setup');
  const c = http.post(`${API}/customer/create`, JSON.stringify(customerBody()), params(token, 'POST /customer/create'));
  const customer = json(c, 'createdCustomer');
  if (!customer) throw new Error(`customer create failed: ${c.status} ${c.body}`);
  return { token, customer };
}

/** One realistic iteration: 60% browse, 20% create a document, 10% open one, 10% create a customer. */
export function userJourney({ token, customer }) {
  const roll = Math.random();

  if (roll < 0.6) {
    group('browse', () => {
      check(http.get(`${API}/user/profile`, params(token, 'GET /user/profile')), { 'profile 200': (r) => r.status === 200 });
      check(http.get(`${API}/customer/all`, params(token, 'GET /customer/all')), { 'customers 200': (r) => r.status === 200 });
      check(http.get(`${API}/document/all`, params(token, 'GET /document/all')), { 'documents 200': (r) => r.status === 200 });
    });
  } else if (roll < 0.8) {
    group('create document', () => {
      const res = http.post(`${API}/document/create`, JSON.stringify(documentBody(customer)), params(token, 'POST /document/create'));
      check(res, { 'document 200': (r) => r.status === 200, 'has number': (r) => !!json(r, 'newDocument.documentNumber') });
    });
  } else if (roll < 0.9) {
    group('open document', () => {
      const list = http.get(`${API}/document/all`, params(token, 'GET /document/all'));
      const id = json(list, 'myDocuments.0._id');
      if (id) {
        check(http.get(`${API}/document/${id}`, params(token, 'GET /document/:id')), { 'document found': (r) => r.status === 200 });
      }
    });
  } else {
    group('create customer', () => {
      const res = http.post(`${API}/customer/create`, JSON.stringify(customerBody()), params(token, 'POST /customer/create'));
      check(res, { 'customer 200': (r) => r.status === 200 });
    });
  }
  sleep(Math.random() * 1.5 + 0.5); // think time
}
