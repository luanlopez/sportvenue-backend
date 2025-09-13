import { ApiProperty } from '@nestjs/swagger';
import { BillingHistoryDto } from './billing-history.dto';

export class PaginatedBillingHistoryDto {
  @ApiProperty({ description: 'Dados do histórico de cobrança' })
  data: BillingHistoryDto;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Itens por página' })
  limit: number;

  @ApiProperty({ description: 'Total de itens' })
  total: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ description: 'Tem página anterior?' })
  hasPrevious: boolean;

  @ApiProperty({ description: 'Tem próxima página?' })
  hasNext: boolean;
}
