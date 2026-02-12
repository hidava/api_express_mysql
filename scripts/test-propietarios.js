// scripts/test-propietarios.js
const fetch = global.fetch || require('node-fetch');
const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

(async () => {
  // Test check cedula con varios valores (incluye una cédula numérica real conocida)
  const checkUrl = `${BASE}/api/v1/propietarios/check`;
  for (const ced of ['V12345678', '207650988']) {
    const res = await fetch(checkUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cedula: ced }) });
    console.log(`POST /propietarios/check (${ced}) ->`, res.status, await res.text());
  }

  // Test crear paciente con cédula real
  const pacienteUrl = `${BASE}/api/v1/pacientes`;
  const paciente = {
    nombreMascota: 'Test', especie: 'Perro', raza: 'Mix', edad: 2, peso: 3.5, altura: 30, propietarios_cedula: '207650988'
  };
  const res2 = await fetch(pacienteUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paciente) });
  console.log('POST /pacientes ->', res2.status, await res2.text());
})();
