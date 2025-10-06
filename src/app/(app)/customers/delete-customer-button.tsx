import { Customer } from "@/app/actions/customers";
import { DeleteCustomerDialog } from "./delete-customer-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteCustomerButton({ customer }: { customer: Customer }) {
  return (
    <DeleteCustomerDialog customer={customer}>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </DeleteCustomerDialog>
  );
}
