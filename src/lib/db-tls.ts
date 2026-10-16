import { isIP } from 'node:net'
import type { ConnectionOptions } from 'node:tls'

/**
 * TLS verificado para o Postgres do Supabase — usado pelo `Pool` do app
 * (`src/lib/db.ts`) e pelos scripts de `scripts/`, por isso sem `server-only`.
 *
 * A Supabase assina o certificado do pooler com uma CA PRÓPRIA, fora da trust
 * store do Node (sem `ca` o handshake falha com SELF_SIGNED_CERT_IN_CHAIN).
 * Embutir a raiz aqui é o que permite verificar cadeia e nome em vez de
 * desligar a verificação. Certificado de CA é público: não é segredo.
 *
 * Cadeia servida hoje (16/10/2026, igual pelo proxy e pelo pooler direto):
 * `*.pooler.supabase.com` (até 11/03/2030) → "Supabase Intermediate 2021 CA"
 * (até 21/10/2033) → raiz 2021 abaixo. Se a Supabase trocar a raiz por uma que
 * não esteja aqui, toda conexão falha com erro de certificado: baixar a raiz
 * nova no dashboard (Database Settings → SSL Configuration), conferir o
 * SHA-256, acrescentar ao array e fazer deploy.
 */

/**
 * Raiz 2021 — a que assina a cadeia do nosso pooler hoje.
 * Origem: botão do dashboard,
 * https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt
 * (byte-idêntica a https://github.com/supabase/cli/blob/develop/apps/cli-go/internal/gen/types/templates/prod-ca-2021.crt).
 * SHA-256 80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA
 * Válida de 28/04/2021 a 26/04/2031.
 */
const SUPABASE_ROOT_CA_2021 = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----
`

/**
 * Raiz 2025 ("snap") — mesmo nome "Supabase Root 2021 CA", OUTRA chave. Não
 * assina a nossa cadeia hoje; está aqui de reserva, para que uma migração do
 * pooler para ela não derrube a captação de leads. O CLI oficial confia nas
 * duas (`caProd + caSnap`). Origem:
 * https://github.com/supabase/cli/blob/develop/apps/cli-go/internal/gen/types/templates/prod-ca-2025.crt
 * (commit 891a5df913, "feat: add ssl certs for snap").
 * SHA-256 5F:9B:77:95:1A:7A:A1:30:3F:9B:58:EE:A9:BF:A8:9E:35:8C:FD:C1:5F:97:86:FF:10:D4:93:0A:72:2C:9A:E2
 * Válida de 03/09/2025 a 01/09/2035.
 */
const SUPABASE_ROOT_CA_2025 = `-----BEGIN CERTIFICATE-----
MIIDxzCCAq+gAwIBAgIUeX+gpfmsRW9asFkRvjyXjHxbfgcwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTI1MDkwMzA4MDEyNVoXDTM1MDkwMTA4MDEyNVow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5Ve7
i9UAmc7luUilELPtqzEk8nGHxg7nY0aCStr625M7+K4OPO6RUllTsHh47k1jWyzm
LXLlyYwCsYCjQp+3vn06H+F/HRUxBt6CK2B7bNng230exTunk0xFvfkX6YgHR7B3
1B7L25Rq3PhuRFPV4hnGYRam2XBZC4UNPqoAgrhV0HOYzXXAVoTr2yaBTMnB331Z
RwOmINh7eqTCk/JRZbb6vfZOhZRAVAe9AoRLoG8aKwmeoLGwlu0UuFx6z3E+6bmA
fSNa8Lx02GEoCdPLw9IRKUFq/SgBpQUKm44H1fDwTjH2CMM0N4p0mL/6wXnNeHvt
C40MmKZ0RcVmHE5wBwIDAQABo2MwYTAdBgNVHQ4EFgQUjvEE541toZcwtXQlZlcB
YOBRTnowHwYDVR0jBBgwFoAUjvEE541toZcwtXQlZlcBYOBRTnowDwYDVR0TAQH/
BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAYYwDQYJKoZIhvcNAQELBQADggEBACD5IcGP
XKvS9qg0CgEQPFqYavt5c7P+0xxFgiZe+xoG8fUw58yNeK2APtgGPRpxEOGfAlNx
z9HDt4gcyHEE00B3qAVDm49pqNxioFWzNqU2LGfM/HL1QmN6urR7hCOkVCJddvOc
FhFX4nZDuRfaBboDvS5HlK3Pzxddp9hvrJi2bemr8HLqYc3HzmVckgPGSLML6t+h
4LRCXSlQsDgQ1LZ4KHsl4cq7K51N6FOXQBLB5q4lMKhs0VUhCT8Pdsj12+84laCV
c22q6p2mdT9SaernCSRnWazXWisgpjv3H7Ex4S1DCYjJIwn3PUToGFv1r8YRN2/S
O19yVSxxCIf64Sg=
-----END CERTIFICATE-----
`

export const SUPABASE_ROOT_CAS: readonly string[] = [SUPABASE_ROOT_CA_2021, SUPABASE_ROOT_CA_2025]

/**
 * Nome conferido no certificado quando a URI aponta para um IP. A produção
 * conecta pelo HAProxy da VPS (143.244.162.48:7432, `mode tcp`), que repassa o
 * TLS do pooler sem terminá-lo — o certificado é o de `*.pooler.supabase.com`.
 * Com host IP, o Node conferiria o nome contra `localhost` e recusaria. Como o
 * certificado é curinga, outra região do pooler continua valendo; só um backend
 * fora de `*.pooler.supabase.com` em `/opt/pg-proxy/haproxy.cfg` exige trocar
 * este nome, senão a conexão cai com ERR_TLS_CERT_ALTNAME_INVALID.
 */
export const SUPABASE_POOLER_HOST = 'aws-0-us-east-2.pooler.supabase.com'

/**
 * Parâmetros da URI que fazem o `pg-connection-string` (2.14) descartar ou
 * sobrescrever o objeto `ssl` passado no código — `sslmode`/`sslrootcert`/
 * `sslcert`/`sslkey` trocam o objeto inteiro por `{}` (perde `ca` e
 * `servername`), `ssl` e `sslnegotiation` podem trocá-lo por `true`/`false`, e
 * `uselibpqcompat` muda a semântica do `sslmode`. São removidos em vez de
 * recusados: o valor real da `DATABASE_URI` da Vercel não é legível, e lançar
 * aqui derrubaria a captação de leads.
 */
const PARAMETROS_SSL_DA_URI = [
  'sslmode',
  'sslrootcert',
  'sslcert',
  'sslkey',
  'ssl',
  'sslnegotiation',
  'uselibpqcompat',
]

const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1'])

export type ConexaoComTls = {
  connectionString: string | undefined
  ssl: false | ConnectionOptions
}

/** Host da URI sem os colchetes do IPv6 e em minúsculas (`postgresql:` não normaliza). */
function hostDaUri(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
}

function tlsVerificado(host: string | null): ConnectionOptions {
  return {
    ca: [...SUPABASE_ROOT_CAS],
    // Com host DNS o `pg` já usa o próprio host como `servername`
    // (`pg/lib/connection.js`, `upgradeToSSL`); só o IP precisa do nome fixo.
    ...(host !== null && isIP(host) !== 0 ? { servername: SUPABASE_POOLER_HOST } : {}),
    // Já é o default do Node; explícito para que ninguém precise adivinhar.
    rejectUnauthorized: true,
  }
}

/** Remove da URI os parâmetros de SSL; devolve a string original se não houver nenhum. */
function semParametrosSsl(connectionString: string, url: URL): string {
  if (!PARAMETROS_SSL_DA_URI.some((p) => url.searchParams.has(p))) return connectionString
  for (const p of PARAMETROS_SSL_DA_URI) url.searchParams.delete(p)
  return url.toString()
}

/**
 * Opções `connectionString` + `ssl` para o `Pool` do `pg`, com TLS verificado
 * contra as raízes da Supabase. Host local (testes, Docker) fica sem TLS.
 * Nunca loga a string — ela carrega a senha.
 */
export function conexaoComTls(connectionString: string | undefined): ConexaoComTls {
  // Sem URI (build da CI, e2e com `DATABASE_URI=''`): o `pg` só tenta conectar
  // na primeira query e falha ali; o TLS fica verificado para não abrir brecha.
  if (!connectionString) return { connectionString, ssl: tlsVerificado(null) }

  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    // String que o `URL` não lê (o `pg` tem seus próprios remendos para isso):
    // segue intacta, sem como remover parâmetros, mas com TLS verificado.
    return { connectionString, ssl: tlsVerificado(null) }
  }

  const host = hostDaUri(url)
  return {
    connectionString: semParametrosSsl(connectionString, url),
    ssl: HOSTS_LOCAIS.has(host) ? false : tlsVerificado(host),
  }
}
