import { Column, Row } from '@expo/ui';

import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { EqualLine } from '@/components/forms/EqualLine';
import { ExpenseLineCells } from '@/components/forms/ExpenseLineCells';
import { AttachmentList } from '@/components/forms/ExpenseItemFields';
import { ExpenseTypeField } from '@/components/forms/ExpenseTypeField';
import { SwipeToDelete } from '@/components/forms/SwipeToDelete';
import { fullWidth } from '@/components/forms/fullWidth';
import { EXPENSE_TYPE_OPTIONS, expenseTypeLabel, withCurrentExpenseType, type ExpenseTypeOption } from '@/constants/expenseTypes';
import type { LocalAttachment } from '@/models/expense';
import type { ExpenseItemFormValues } from '@/schemas/expenseSchema';
import { formatAmountInput, parseTlToKurus } from '@/utils/money';

export type ExpenseCell = 'type' | 'amount' | 'note' | 'docs';

const COLUMNS: ExpenseCell[] = ['type', 'amount', 'note', 'docs'];
const HEADERS = ['Tür', 'Tutar', 'Not', 'Belge'];

export function ExpenseLineHeader() {
  return <EqualLine cells={HEADERS} />;
}

export function ExpenseLineTotal({ amount }: { amount: string }) {
  return <EqualLine kind="total" cells={[' ', amount, ' ', ' ']} />;
}

export function ExpenseLineReadRow({ cells, onDocs }: { cells: string[]; onDocs?: () => void }) {
  return <EqualLine kind="row" cells={cells} pressIndexes={onDocs ? [3] : undefined} onPress={onDocs ? () => onDocs() : undefined} />;
}

export function ExpenseLineRow({
  item,
  deletable,
  active,
  openColumn,
  amountError,
  noteError,
  onOpen,
  onType,
  onAmount,
  onNote,
  onAddLibrary,
  onAddCamera,
  onAddPdf,
  onOpenAttachment,
  onRemoveAttachment,
  onRetry,
  onDelete,
  typeOptions = EXPENSE_TYPE_OPTIONS,
}: {
  item: ExpenseItemFormValues;
  deletable: boolean;
  active: boolean;
  openColumn: ExpenseCell | null;
  amountError?: string;
  noteError?: string;
  onOpen: (item: ExpenseItemFormValues, column: ExpenseCell) => void;
  onType: (type: ExpenseItemFormValues['type']) => void;
  onAmount: (value: string) => void;
  onNote: (value: string) => void;
  onAddLibrary: () => void;
  onAddCamera: () => void;
  onAddPdf: () => void;
  onOpenAttachment: (attachment: LocalAttachment) => void;
  onRemoveAttachment: (attachment: LocalAttachment) => void;
  onRetry: (attachment: LocalAttachment) => void;
  onDelete: (item: ExpenseItemFormValues) => void;
  typeOptions?: readonly ExpenseTypeOption[];
}) {
  const docLabel = item.attachments.length > 0 ? String(item.attachments.length) : '-';
  const selected = active ? COLUMNS.indexOf(openColumn ?? 'type') : null;
  const options = withCurrentExpenseType(typeOptions, item.type);
  return (
    <SwipeToDelete enabled={deletable} onDelete={() => onDelete(item)}>
      <Column spacing={8} modifiers={fullWidth}>
        <ExpenseLineCells
          type={item.type}
          cells={[expenseTypeLabel(item.type, item.customType, options), item.amount.trim() || '0,00', item.note?.trim() || '-', docLabel]}
          selected={openColumn ? selected : null}
          options={options}
          onType={onType}
          onPress={(index) => {
            const column = COLUMNS[index];
            if (column) {
              onOpen(item, column);
            }
          }}
        />
        {active && openColumn === 'type' ? <ExpenseTypeField appearance="menu" value={item.type} options={options} onChange={onType} /> : null}
        {active && openColumn === 'amount' ? (
          <TextField
            label="Tutar"
            value={item.amount}
            autoFocus
            onChangeText={onAmount}
            onBlur={() => {
              const kurus = parseTlToKurus(item.amount);
              if (kurus !== null) {
                onAmount(formatAmountInput(kurus));
              }
            }}
            error={amountError}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
        ) : null}
        {active && openColumn === 'note' ? <TextField label="Not" value={item.note ?? ''} autoFocus onChangeText={onNote} error={noteError} placeholder="-" /> : null}
        {active && openColumn === 'docs' ? (
          <Column spacing={8}>
            <Row spacing={8}>
              <Button label="Galeri" variant="secondary" onPress={onAddLibrary} />
              <Button label="Kamera" variant="secondary" onPress={onAddCamera} />
              <Button label="PDF" variant="secondary" onPress={onAddPdf} />
            </Row>
            <AttachmentList attachments={item.attachments} onOpen={onOpenAttachment} onRemove={onRemoveAttachment} onRetry={onRetry} />
          </Column>
        ) : null}
      </Column>
    </SwipeToDelete>
  );
}
