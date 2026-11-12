import IconHeader from "@/components/common/table/columns/icon-header";
import LocaleViewColumn from "@/components/common/table/columns/locale-view.column";
import ChangeStatusTableAction from "@/components/common/table/tableActions/ChangeStatusTableAction";
import { type ColumnDef } from "@tanstack/react-table";

export default function CitiesColumns(): ColumnDef<Record<string, unknown>>[] {
  const columns = [
    {
      accessorKey: "name",
      header: () => <IconHeader key="name" columnKey="Name" />,
      cell: ({ row }) => {
        const en = row.original.name?.en as string;
        const ar = row.original.name?.ar as string;
        return (
          <LocaleViewColumn value={{ en, ar }} />
        );
      }
    },
    {
      accessorKey: "active",
      header: () => <IconHeader key="active" columnKey="Active" />,
      cell: ({ row }) => {
        const id = String(row.original.id);
        const active = String(row.original.active ?? "true");
        return (
          <div className="flex justify-center">
            <ChangeStatusTableAction
              id={id}
              status={active}
              options={["true", "false"]}
              endpoint={["cities"]}
              statusKey="active"
              type="switch"
            />
          </div>
        );
      }
    },
    {
      accessorKey: "customDeliveryActive",
      header: () => <IconHeader key="customDeliveryActive" columnKey="customDeliveryActive" />,
      cell: ({ row }) => {
        const id = String(row.original.id);
        const customDeliveryActive = String(row.original.customDeliveryActive ?? "true");
        return (
          <div className="flex justify-center">
            <ChangeStatusTableAction
              id={id}
              status={customDeliveryActive}
              options={["true", "false"]}
              endpoint={["cities"]}
              statusKey="customDeliveryActive"
              type="switch"
            />
          </div>
        );
      }
    }
  ];

  return columns;
}
