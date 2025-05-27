export const ApiMessages = {
  Auth: {
    InvalidCredentials: {
      title: 'Credenciais Inválidas',
      message: 'Email ou senha incorretos',
    },
    EmailExists: {
      title: 'Email já Cadastrado',
      message: 'E-mail já existente, tente outro por favor!',
    },
    DocumentExists: {
      title: 'CPF já Cadastrado',
      message: 'CPF já existente, tente outro por favor!',
    },
    InvalidCode: {
      title: 'Código Inválido',
      message: 'Código de verificação inválido ou expirado',
    },
    TokenExpired: {
      title: 'Token Expirado',
      message:
        'O token de verificação expirou. Por favor, solicite um novo código.',
    },
  },

  Court: {
    NotFound: {
      title: 'Quadra não Encontrada',
      message: 'A quadra solicitada não foi encontrada',
    },
    InvalidData: {
      title: 'Dados Inválidos',
      message: 'Os dados fornecidos para a quadra são inválidos',
    },
    DeleteSuccess: {
      message: 'Quadra excluída com sucesso',
    },
  },

  User: {
    NotFound: {
      title: 'Usuário não Encontrado',
      message: 'O usuário solicitado não foi encontrado',
    },
  },

  Reservation: {
    NotFound: {
      title: 'Reserva não Encontrada',
      message: 'A reserva solicitada não foi encontrada',
    },
    InvalidStatus: {
      title: 'Status Inválido',
      message: 'O status da reserva é inválido',
    },
    UnavailableTime: {
      title: 'Horário Indisponível',
      message: 'O horário selecionado não está disponível',
    },
    CancelRequestInvalid: {
      title: 'Solicitação de Cancelamento inválido',
      message:
        'Não foi possível processar a solicitação de cancelamento porque sua reserva não está pendente.',
    },
    InvalidType: {
      title: 'Tipo de Reserva Inválido',
      message: 'O tipo de reserva informado é inválido',
    },
    InvalidDates: {
      title: 'Datas Inválidas',
      message: 'As datas informadas para a reserva mensal são inválidas',
    },
  },

  Generic: {
    InternalError: {
      title: 'Erro Interno',
      message: 'Ocorreu um erro interno no servidor',
    },
    RequestError: {
      title: 'Erro na Requisição',
      message: 'A requisição contém dados inválidos',
    },
  },

  Documentation: {
    ApiTitle: 'SportMap API',
    ApiDescription:
      'API for managing and locating sports venues. Allows users to view, search, and book sports courts, including detailed information about each venue such as address, available hours, and operational status.',
    ApiVersion: '1.0',
  },

  Payment: {
    Failed: {
      title: 'Falha no Pagamento',
      message: 'Não foi possível processar o pagamento',
    },
    WebhookFailed: {
      title: 'Falha no Webhook',
      message: 'Erro ao processar webhook do Stripe',
    },
  },

  Subscription: {
    NoPlan: {
      title: 'Plano não encontrado',
      message: 'Usuário não possui um plano ativo',
    },
    PlanNotFound: {
      title: 'Plano não encontrado',
      message: 'Plano de assinatura não encontrado',
    },
    CourtLimitExceeded: {
      title: 'Limite de Quadras Atingido',
      message:
        'Você atingiu o limite de quadras do seu plano atual. Faça um upgrade para adicionar mais quadras.',
    },
    InvalidPlan: {
      title: 'Plano Inválido',
      message: 'O plano selecionado é inválido',
    },
    Expired: {
      title: 'Assinatura Expirada',
      message: 'Sua assinatura expirou. Por favor, renove para continuar.',
    },
    UpgradeFailed: {
      title: 'Falha no Upgrade',
      message: 'Não foi possível realizar o upgrade do plano',
    },
    InternalError: {
      title: 'Erro Interno',
      message: 'Ocorreu um erro interno no servidor',
    },
  },
  Dashboard: {
    Failed: {
      title: 'Falha ao Obter Dados do Dashboard',
      message: 'Não foi possível obter os dados do dashboard',
    },
  },
} as const;
