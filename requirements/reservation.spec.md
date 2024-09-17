# Documento de Especificações do Módulo de Reservas

## Regras de Negócio

### Usuário Comum

#### Solicitar Reserva
- O usuário pode solicitar uma reserva para um tribunal.
- Deve especificar o tribunal, o horário de início e o horário de fim da reserva.
- O sistema deve verificar a disponibilidade do horário solicitado.
- Se o horário estiver disponível, a reserva é marcada como "solicitada".

#### Cancelar Reserva
- O usuário pode cancelar uma reserva previamente feita.
- A reserva deve ser marcada como "cancelada".
- O cancelamento deve ser feito com antecedência mínima (se aplicável).

### Usuário Owner

#### Aprovar Reserva
- O owner pode aprovar uma reserva solicitada para seu tribunal.
- A reserva deve ser marcada como "aprovada".
- O owner pode visualizar detalhes da reserva antes de aprová-la.

#### Rejeitar Reserva
- O owner pode rejeitar uma reserva solicitada para seu tribunal.
- A reserva deve ser marcada como "rejeitada".
- O owner pode visualizar detalhes da reserva antes de rejeitá-la.

## Notificações por E-mail

### Reserva Solicitada
- Quando uma reserva é solicitada, um e-mail deve ser enviado para o owner do tribunal informando sobre a nova reserva solicitada.
- O e-mail deve incluir detalhes da reserva, como horário, tribunal, e informações do usuário solicitante.

### Reserva Aprovada ou Rejeitada
- Quando uma reserva é aprovada ou rejeitada, um e-mail deve ser enviado ao usuário que fez a reserva.
- O e-mail deve informar o status da reserva e incluir detalhes sobre o tribunal e o horário reservado.

### Cancelamento de Reserva
- Quando um usuário cancela uma reserva, um e-mail deve ser enviado ao usuário confirmando o cancelamento.
- O e-mail deve incluir detalhes sobre o tribunal e o horário da reserva cancelada.

## Fluxos de Processo

### Solicitação de Reserva
1. O usuário comum solicita uma reserva.
2. O sistema verifica a disponibilidade do horário.
3. Se disponível, o sistema marca a reserva como "solicitada".
4. Um e-mail é enviado ao owner do tribunal informando sobre a reserva solicitada.

### Aprovação/Rejeição de Reserva
1. O owner visualiza reservas solicitadas.
2. O owner aprova ou rejeita a reserva.
3. O sistema atualiza o status da reserva para "aprovada" ou "rejeitada".
4. Um e-mail é enviado ao usuário com o status da reserva.

### Cancelamento de Reserva
1. O usuário comum cancela uma reserva.
2. O sistema marca a reserva como "cancelada".
3. Um e-mail é enviado ao usuário confirmando o cancelamento.
