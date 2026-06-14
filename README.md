# desafio-qa-reservas-online
Resolução de teste técnico para QA abordando cenários BDD e análise de bugs.

# Plano de Testes e Relatório de Execução - Reservas Online

Este repositório contém a documentação completa dos cenários de teste, mapeamento em BDD (Gherkin) e relatório detalhado de execução referente ao teste técnico para a vaga de QA. 

O foco desta avaliação foi auditar os fluxos críticos de negócio, a integridade dos cálculos financeiros, a resiliência do sistema e a conformidade da interface de usuário (UI).

---

## 1. Justificativa da Escolha dos Cenários de Teste

Para garantir uma cobertura de testes de alta qualidade e com foco em riscos de negócio (*Risk-Based Testing*), os cenários foram estrategicamente selecionados indo além do "caminho feliz":

1. **Validação do Funil Principal (Core Business):** Garantir que o fluxo de ponta a ponta (Busca, Seleção, Personalização, Cadastro e Pagamento) funcione operacionalmente.
2. **Validação de Regras de Negócio por Faixa Etária:** Testar se o motor de regras diferencia corretamente hóspedes pagantes de crianças isentas (menores de 5 anos).
3. **Auditoria de Cálculos Financeiros (Risco Crítico):** Erros matemáticos em e-commerce impactam diretamente o faturamento da empresa. Foram auditadas as tags de descontos (32% e 36%) e multiplicadores de diárias.
4. **Integridade Fiscal (Cálculo de Impostos):** Testar se taxas obrigatórias (como o ISS) estão sendo somadas ao montante final no carrinho.
5. **Sanidade de Dados e Governança:** Validar se dados internos de homologação estão vazando para o usuário final no ambiente produtivo.
6. **Integrações de Terceiros (API):** Analisar o comportamento do sistema perante limites de APIs externas (reCAPTCHA e busca de CEP).

---

## 2. Cenários de Teste em Padrão BDD (Gherkin)

### Funcionalidade: Funil de Reserva de Hospedagem

```gherkin
Cenário: CT-01 - Busca de disponibilidade padrão com sucesso
  Dado que o usuário acessa a página inicial do portal "Reservas Online"
  E seleciona o período de check-in "12/06/2026" e check-out "20/06/2026"
  E preenche a ocupação com "2 Adultos" e "2 Crianças"
  Quando clica no botão "Verificar Disponibilidade"
  Então o sistema deve redirecionar para a página de listagem de acomodações disponíveis

Cenário: CT-02 - Validação da regra de gratuidade para menores de 5 anos
  Dado que o usuário realiza uma busca para o período de "19/06/2026" a "26/06/2026" (7 diárias)
  Quando define a ocupação com 2 adultos, 1 criança pagante e 1 criança menor de 5 anos (Isenta)
  Então o valor bruto original da tarifa deve ser reduzido de R$ 14.700,00 para R$ 14.350,00
  E o modal de hóspedes deve identificar a criança na categoria "FREE"

Cenário: CT-03 - Validação do cálculo sistêmico de desconto padrão (32%)
  Dado que o usuário visualiza os resultados para a acomodação "STANDARD ST1"
  Quando o sistema apresenta o valor original de "R$ 16.800,00" com uma tag de desconto de "32%"
  Então o total das diárias exibido deve ser o resultado exato da subtração matemática ("R$ 11.424,00")

Cenário: CT-04 - Validação do cálculo de desconto por estadia longa (Length Stay - 36%)
  Dado que o usuário seleciona um período de longa permanência (7 diárias)
  Quando o sistema aplica a tag promocional "36% Tarifa especial Length Stay" sobre o valor base de "R$ 14.350,00"
  Então o valor final calculado e exibido em tela deve ser exatamente "R$ 9.184,00"

Cenário: CT-05 - Validação da integridade financeira do subtotal e impacto do ISS
  Dado que o usuário adiciona a acomodação ao carrinho de compras
  Quando o painel lateral de "Resumo" detalha o custo com "Total das diárias" e "Taxa de ISS"
  Então o campo "Valor total" deve ser a soma exata de ambos os valores apresentados

Cenário: CT-06 - Validação de multiplicadores diários na adição de itens opcionais
  Dado que a reserva atual possui um total de "7" diárias
  Quando o usuário adiciona "1" unidade do opcional "BALDE DE GELO" (R$ 25,00) como "Todos os dias"
  Então o sistema deve multiplicar o valor unitário pelas diárias, exibindo o subtotal de "R$ 175,00"

Cenário: CT-07 - Higienização de dados e governança no catálogo de opcionais
  Dado que o usuário abre a listagem de serviços adicionais
  Quando a interface renderiza os opcionais disponíveis
  Então não devem ser exibidos produtos com nomenclatura de testes internos ou valores de homologação

Cenário: CT-08 - Responsividade e integridade do layout do modal de opcionais
  Dado que o usuário interage com o modal de opcionais
  Quando a janela é renderizada em tela
  Então as informações de quantidades e valores devem estar alinhadas dentro das margens visíveis do componente

Cenário: CT-09 - Segmentação do formulário de registro por faixa etária
  Dado que o usuário avança para a etapa de identificação dos hóspedes
  Quando o modal de formulário é aberto
  Então o sistema deve gerar campos segmentados condizentes com a busca inicial (Adultos, Crianças-FREE e Crianças-FAIXA 2)

Cenário: CT-10 - Autopreenchimento de endereço via consulta à API de CEP
  Dado que o usuário está na etapa de preenchimento dos dados de cobrança
  Quando insere um CEP válido (ex: "03927-040") no campo correspondente
  Então os campos de "Cidade", "Estado", "Bairro" e "Endereço" devem ser preenchidos automaticamente

Cenário: CT-11 - Resiliência da interface perante limites de APIs de segurança
  Dado que o validador reCAPTCHA atinge o limite de cota gratuita
  Quando o usuário interage com o formulário
  Então o sistema deve tratar o erro ou exibir um aviso amigável sem bloquear indevidamente um usuário legítimo

Cenário: CT-12 - Submissão do fluxo completo e redirecionamento para pagamento
  Dado que todos os dados obrigatórios foram preenchidos e validados
  Quando o usuário clica no botão "Finalizar"
  Então o sistema deve consolidar o carrinho e redirecionar para a rota de "/Pagamento"
```
## 3. Relatório de Execução dos Testes (Matriz de Resultados)

Para complementar a documentação em Gherkin, disponibilizei a matriz de testes completa em formato de planilha. Este documento atua como o log formal de execução e contém:

* **Mapeamento de Cenários:** Detalhamento do passo a passo realizado no sistema.
* **Matriz de Status (Pass/Fail):** Visão clara e direta dos testes que obtiveram sucesso (Acertos) e dos cenários que reprovaram (Falhas/Bugs).
* **Análise de Variáveis:** O comparativo documentado entre o Resultado Esperado e o Resultado Obtido.

-> [Clique aqui para baixar a Planilha de Execução de Testes (.xlsx)](Matriz%20de%20Resultados%20-%20Testes.xlsx)
