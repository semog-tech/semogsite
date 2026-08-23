/**
 * Faixa de conversão entre o vídeo e o formulário — porte da
 * `<section class="band s-brand">` do protótipo aprovado. Fundo
 * `--color-navy-600` (a superfície `.s-brand`), botão claro, e o segundo dos
 * dois CTAs da página que apontam para `#inscricao`.
 *
 * O plano pedia repetir "gratuito e {seats} vagas" aqui; o protótipo aprovado
 * diz "Evento gratuito … Vagas limitadas". Mantido o texto do protótipo: o
 * número já aparece no hero e volta na seção de inscrição (Task 7), e repetir
 * "200" pela terceira vez em meia página cansa sem informar.
 */
export function ExperienceCta() {
  return (
    <section className="band s-brand">
      <div className="wrap">
        <h2>Participe de uma manhã incrível e transforme seu bem-estar.</h2>
        <div className="side">
          <a className="btn btn-light" href="#inscricao">
            Quero me inscrever
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <p>Evento gratuito e aberto a clientes, parceiros e amigos da Semog. Vagas limitadas.</p>
        </div>
      </div>
    </section>
  )
}
