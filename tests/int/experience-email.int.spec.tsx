import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'
import { site } from '@/../content/site'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import ExperienceAutoReply from '@/emails/ExperienceAutoReply'

/**
 * O e-mail de confirmação da inscrição no Experience — enviado de verdade pela
 * Server Action (`submit-form.ts`, ramo `formType === 'experience'`), não é
 * template de gaveta.
 *
 * Até 15/09/2026 nenhum teste importava `src/emails/`: dava para apagar o
 * logradouro ou a regra do kit do template e a suíte inteira saía verde. O que
 * manteve a cobertura longe daqui foi um comentário em
 * `experience-form.int.spec.tsx` afirmando que este e-mail não existia — ele
 * existe desde 14/09/2026, e o comentário agora aponta para cá.
 *
 * O painel de sucesso do formulário fica na tela de quem acabou de se
 * inscrever; este e-mail é o que sobra depois que a aba fecha. Perder o
 * endereço aqui manda alguém para a orla sem saber onde parar, num sábado de
 * manhã, e ninguém descobre antes do dia.
 *
 * Cada asserção é dupla, como em `experience-seo`: contra o LITERAL confirmado,
 * para o valor não voltar sozinho ao rascunho, e contra `EXPERIENCE_EVENT`,
 * para o template não poder digitar o dado à mão. Uma só das duas não cobre.
 */

/**
 * O texto que chega a quem abre o e-mail. Renderiza pelo MESMO `render` que
 * `src/lib/sendgrid.ts` usa no envio — um atalho de teste provaria outra coisa.
 *
 * O bloco do `<Preview>` é descartado: ele é invisível na caixa de entrada e
 * repete nome e data do evento, então contá-lo deixaria passar uma data
 * apagada do corpo.
 */
async function corpoDoEmail(name?: string): Promise<string> {
  const html = await render(<ExperienceAutoReply name={name} />)
  const doc = new DOMParser().parseFromString(html, 'text/html')
  for (const elemento of Array.from(doc.querySelectorAll<HTMLElement>('[style]'))) {
    if (elemento.style.display === 'none') elemento.remove()
  }
  return doc.body.textContent ?? ''
}

describe('ExperienceAutoReply — o e-mail que o inscrito guarda', () => {
  it('diz quando é: data, dia da semana e horário', async () => {
    const corpo = await corpoDoEmail('Maria Souza')

    expect(corpo).toContain('26 de setembro de 2026')
    expect(corpo).toContain(E.dateLabel)
    expect(corpo).toContain('sábado')
    expect(corpo).toContain(E.weekday)
    expect(corpo).toContain('07h30 às 10h')
    expect(corpo).toContain(E.timeLabel)
  })

  it('diz onde é, com o logradouro e o ponto de referência', async () => {
    const corpo = await corpoDoEmail('Maria Souza')

    expect(corpo).toContain('Centro de Atendimento ao Turista Adaptado')
    expect(corpo).toContain(E.venue)
    // O nome do prédio não coloca ninguém na orla: sem a avenida, o e-mail
    // manda procurar um endereço que ele mesmo não tem.
    expect(corpo).toContain('Avenida Cabo Branco')
    expect(corpo).toContain(E.street)
    expect(corpo).toContain("em frente à Sapore D'Italia")
    expect(corpo).toContain(E.venueReference)
    // Bairro, cidade e UF na forma que o dado declara e que hero, rodapé e
    // painel da programação já usam — não numa quarta variação só daqui.
    expect(corpo).toContain('Cabo Branco — João Pessoa, PB')
    expect(corpo).toContain(`${E.district} — ${E.city}, ${E.uf}`)
  })

  it('avisa que o kit é retirado antes, na filial, e diz onde ela fica', async () => {
    const corpo = await corpoDoEmail('Maria Souza')

    expect(corpo).toContain('23 de setembro')
    expect(corpo).toContain(E.kit.pickup.fromDateLabel)
    expect(corpo).toContain('quarta')
    expect(corpo).toContain(E.kit.pickup.fromWeekday)
    // A regra é o que decide se a pessoa chega na praia com kit ou sem: some
    // daqui e ela descobre no sábado que não há entrega.
    expect(corpo).toMatch(/não há entrega no dia do evento/i)

    // Mandar para "a filial" sem endereço obriga a voltar ao site. Ele sai de
    // `content/site.ts`, mesma fonte do rodapé e da seção do kit, casando pela
    // cidade do evento — a existência da unidade é garantida por
    // `experience-data.int.spec.ts`.
    const filial = site.company.addresses.find((endereco) => endereco.city === E.city)
    if (!filial) throw new Error(`A filial de ${E.city} sumiu de content/site.ts`)
    expect(corpo).toContain('Av. Guarabira, 834, Manaíra, João Pessoa/PB')
    expect(corpo).toContain(filial.address)
  })

  it('confirma a inscrição sem prometer retorno comercial', async () => {
    const corpo = await corpoDoEmail('Maria Souza')

    expect(corpo).toContain('Olá, Maria Souza!')
    expect(corpo).toContain('Semog Experience 26')
    expect(corpo).toContain(E.name)
    // A razão de este template existir em vez do `ContactAutoReply`: o
    // genérico promete que "em breve alguém vai retornar pra você", o que é
    // falso num evento gratuito e contradiz a frase que o formulário mostra
    // acima do botão.
    expect(corpo).not.toMatch(/em breve/i)
    expect(corpo).toMatch(/não entrou em nenhuma lista comercial/i)
  })

  it('sem nome, saúda sem deixar buraco no lugar dele', async () => {
    const corpo = await corpoDoEmail()

    expect(corpo).toContain('Olá!')
    expect(corpo).not.toMatch(/Olá,\s*!/)
  })
})
