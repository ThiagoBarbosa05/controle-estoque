import { Button } from "@/components/ui/button";
import { CustomerFormDialog } from "./customer-form-dialogs";
import { Edit } from "lucide-react";
import { Customer } from "@/app/actions/customers";

export function EditCustomerButton({ customer }: { customer: Customer }) {
  return (
    <CustomerFormDialog customer={customer}>
      <Button variant="ghost" size="sm">
        <Edit className="h-4 w-4" />
      </Button>
    </CustomerFormDialog>
  );
}
