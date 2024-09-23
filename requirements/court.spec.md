# Gestão de Quadras

## Objetivo
Descrever as regras de negócio e cenários para a gestão de quadras, incluindo criação, atualização, exclusão e reservas.

## Entidades Principais

### Quadra
- **ID**: Identificador único da quadra.
- **Nome**: Nome da quadra.
- **Localização**: Endereço onde a quadra está situada.
- **Tipo**: Tipo de quadra (ex: futebol, basquete, vôlei).
- **Status**: Status atual da quadra (disponível, indisponível).
- **Horários disponíveis**: Horários em que a quadra pode ser reservada.

### Reserva
- **ID**: Identificador único da reserva.
- **ID da quadra**: Referência à quadra reservada.
- **ID do usuário**: Referência ao usuário que fez a reserva.
- **Data e hora da reserva**: Quando a reserva foi feita.
- **Duração**: Duração da reserva.
- **Status**: Status da reserva (confirmada, cancelada, pendente).

## Regras de Negócio

### Criação de Quadras
- **Condição**: A quadra deve ter um nome único e estar localizada em um endereço válido.
- **Processo**:
  1. O administrador insere os dados da quadra.
  2. O sistema valida se o nome da quadra é único.
  3. Se válido, a quadra é criada e armazenada no banco de dados.

### Atualização de Quadras
- **Condição**: O administrador pode atualizar os dados da quadra, incluindo nome, localização e status.
- **Processo**:
  1. O administrador solicita a atualização.
  2. O sistema valida se o nome da quadra (se alterado) é único.
  3. As informações são atualizadas no banco de dados.

### Exclusão de Quadras
- **Condição**: A quadra pode ser excluída apenas se não houver reservas ativas associadas.
- **Processo**:
  1. O administrador solicita a exclusão.
  2. O sistema verifica se há reservas ativas.
  3. Se não houver reservas, a quadra é excluída; caso contrário, retorna um erro.

### Gestão de Reservas
- **Condições**:
  - Um usuário pode solicitar uma reserva apenas para quadras disponíveis.
  - O usuário não pode reservar a mesma quadra para o mesmo horário.
  - O usuário pode cancelar uma reserva, que deve ser aprovada pelo proprietário da quadra.

#### Solicitação de Reserva
- **Processo**:
  1. O usuário seleciona a quadra e o horário desejado.
  2. O sistema verifica a disponibilidade.
  3. Se disponível, a reserva é criada com status "pendente".

#### Aprovação de Reservas
- **Processo**:
  1. O proprietário da quadra recebe uma notificação de nova reserva.
  2. O proprietário pode aprovar ou rejeitar a reserva.
  3. O status da reserva é atualizado de acordo com a decisão.

#### Cancelamento de Reservas
- **Processo**:
  1. O usuário solicita o cancelamento da reserva.
  2. O sistema altera o status da reserva para "requested".
  3. O proprietário aprova ou rejeita o cancelamento.
  4. Se aprovado, a reserva é marcada como "cancelada".

## Cenários de Teste

### Criar Quadra
- **Cenário**: Criar uma quadra com dados válidos.
- **Resultado esperado**: A quadra é criada com sucesso.

### Atualizar Quadra
- **Cenário**: Atualizar os dados da quadra existente.
- **Resultado esperado**: A quadra é atualizada com os novos dados.

### Excluir Quadra
- **Cenário**: Tentar excluir uma quadra com reservas ativas.
- **Resultado esperado**: O sistema não permite a exclusão e retorna uma mensagem de erro.

### Solicitar Reserva
- **Cenário**: Usuário solicita uma reserva para uma quadra disponível.
- **Resultado esperado**: A reserva é criada com status "pendente".

### Aprovar Reserva
- **Cenário**: Proprietário aprova uma reserva pendente.
- **Resultado esperado**: O status da reserva é atualizado para "confirmada".

### Cancelar Reserva
- **Cenário**: Usuário solicita o cancelamento de uma reserva.
- **Resultado esperado**: O status da reserva é atualizado para "requested" e aguardando aprovação do proprietário.
