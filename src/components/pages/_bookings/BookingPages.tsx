"use client";

import { ImageCell } from "@/components/common/table/columns/img-cell";
import { Badge } from "@/components/ui/badge";
import BookingCrud, { CrudColumn } from "./BookingCrud";
import { FieldDef, loc } from "./booking-utils";

const nameCol: CrudColumn = {
  key: "name",
  label: "Name",
  render: (row, { locale }) => loc(row.name ?? row.label ?? row.title, locale) || "-"
};

const imgCol = (key: string, label = "Image"): CrudColumn => ({
  key,
  label,
  render: row => {
    const v = Array.isArray(row[key]) ? row[key][0] : row[key];
    return typeof v === "string" && v ? (
      <div className="h-12 w-16 overflow-hidden rounded">
        <ImageCell cell={v} />
      </div>
    ) : (
      "-"
    );
  }
});

const cityCol: CrudColumn = {
  key: "cityId",
  label: "City",
  render: (row, { locale }) => loc(row.City?.name, locale) || `#${row.cityId}`
};

const activeCol = (key = "isActive"): CrudColumn => ({
  key,
  label: "Active",
  render: row => <Badge variant={row[key] ? "default" : "secondary"}>{row[key] ? "✓" : "✗"}</Badge>
});

const cityField: FieldDef = { name: "cityId", label: "City", type: "remote", required: true, readOnlyOnEdit: false };

// ---------------------------------------------------------------- categories
export function BookingCategoriesPage() {
  return (
    <BookingCrud
      title="Booking Categories"
      endpoint="bookingCategories"
      permissionKey="booking-categories"
      multipart
      filters={[{ kind: "city" }]}
      note="A category of type TABLE_RESERVATION opens the existing table reservation flow in the app and has no places."
      columns={[
        nameCol,
        imgCol("image"),
        { key: "type", label: "Type" },
        cityCol,
        { key: "sortOrder", label: "Sort order" },
        activeCol()
      ]}
      fields={[
        { name: "name", label: "Name", type: "localized", required: true },
        { name: "image", label: "Image", type: "file" },
        {
          name: "type",
          label: "Type",
          type: "select",
          options: [
            { value: "GENERIC", label: "GENERIC" },
            { value: "TABLE_RESERVATION", label: "TABLE_RESERVATION" }
          ]
        },
        cityField,
        { name: "sortOrder", label: "Sort order", type: "number" },
        { name: "isActive", label: "Active", type: "bool" }
      ]}
    />
  );
}

// -------------------------------------------------------------------- places
export function BookingPlacesPage() {
  return (
    <BookingCrud
      title="Booking Places"
      endpoint="bookingPlaces"
      permissionKey="booking-places"
      multipart
      filters={[
        { kind: "city" },
        { kind: "remote", param: "categoryId", label: "Category", endpoint: "bookingCategories", params: { type: "GENERIC" } },
        { kind: "text", param: "search", label: "Search" },
        {
          kind: "select",
          param: "featured",
          label: "Featured",
          options: [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" }
          ]
        }
      ]}
      prefillFromFilters={["categoryId"]}
      columns={[
        nameCol,
        imgCol("cover", "Cover"),
        { key: "categoryId", label: "Category", render: (row, { locale }) => loc(row.Category?.name, locale) || `#${row.categoryId}` },
        cityCol,
        { key: "rating", label: "Rating" },
        activeCol("isFeatured"),
        activeCol()
      ]}
      fields={[
        {
          name: "categoryId",
          label: "Category",
          type: "remote",
          required: true,
          remote: { endpoint: "bookingCategories", params: { type: "GENERIC" } }
        },
        cityField,
        { name: "name", label: "Name", type: "localized", required: true },
        { name: "description", label: "Description", type: "localizedText" },
        { name: "cover", label: "Cover", type: "file", required: true },
        { name: "images", label: "Gallery", type: "files" },
        { name: "address", label: "Address", type: "text" },
        { name: "lat", label: "Latitude", type: "number" },
        { name: "lng", label: "Longitude", type: "number" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "isFeatured", label: "Featured", type: "bool" },
        { name: "isActive", label: "Active", type: "bool" },
        { name: "sortOrder", label: "Sort order", type: "number" }
      ]}
    />
  );
}

// --------------------------------------------------------------------- items
export function BookingItemsPage() {
  return (
    <BookingCrud
      title="Booking Items"
      endpoint="bookingItems"
      permissionKey="booking-items"
      multipart
      requiredFilters={["placeId"]}
      prefillFromFilters={["placeId"]}
      filters={[{ kind: "remote", param: "placeId", label: "Place", endpoint: "bookingPlaces", required: true }]}
      note="Total shown to the customer = price + booking fee. A slot can override the price."
      columns={[
        nameCol,
        imgCol("images", "Images"),
        { key: "price", label: "Price" },
        { key: "bookingFee", label: "Booking fee" },
        { key: "total", label: "Total", render: row => String((Number(row.price) || 0) + (Number(row.bookingFee) || 0)) },
        activeCol()
      ]}
      fields={[
        {
          name: "placeId",
          label: "Place",
          type: "remote",
          required: true,
          remote: { endpoint: "bookingPlaces" }
        },
        { name: "name", label: "Name", type: "localized", required: true },
        { name: "description", label: "Description", type: "localizedText" },
        { name: "images", label: "Images", type: "files" },
        { name: "price", label: "Price", type: "number", required: true },
        { name: "bookingFee", label: "Booking fee", type: "number", required: true, help: "Part of the total, not added on top of it in the app." },
        { name: "isActive", label: "Active", type: "bool" },
        { name: "sortOrder", label: "Sort order", type: "number" }
      ]}
    />
  );
}

// -------------------------------------------------------------------- fields
export function BookingFieldsPage() {
  return (
    <BookingCrud
      title="Booking Fields"
      endpoint="bookingFields"
      permissionKey="booking-fields"
      paginated={false}
      filters={[
        { kind: "remote", param: "categoryId", label: "Category", endpoint: "bookingCategories" },
        { kind: "number", param: "itemId", label: "Item ID" }
      ]}
      prefillFromFilters={["categoryId", "itemId"]}
      note="Extra questions asked in the booking request. Set a category OR an item, not both. Choose a filter first."
      columns={[
        { key: "key", label: "Key" },
        nameCol,
        { key: "type", label: "Type" },
        { key: "required", label: "Required", render: row => (row.required ? "✓" : "-") },
        { key: "sortOrder", label: "Sort order" },
        activeCol()
      ]}
      fields={[
        { name: "categoryId", label: "Category", type: "remote", remote: { endpoint: "bookingCategories" } },
        { name: "itemId", label: "Item ID", type: "number" },
        { name: "key", label: "Key", type: "text", required: true },
        { name: "label", label: "Label", type: "localized", required: true },
        {
          name: "type",
          label: "Type",
          type: "select",
          options: ["TEXT", "NUMBER", "SELECT", "DATE", "BOOLEAN"].map(v => ({ value: v, label: v }))
        },
        {
          name: "options",
          label: "Options (SELECT only)",
          type: "json",
          help: 'JSON array: [{"value":"a","label":{"ar":"...","en":"..."}}]'
        },
        { name: "required", label: "Required", type: "bool" },
        { name: "sortOrder", label: "Sort order", type: "number" },
        { name: "isActive", label: "Active", type: "bool" }
      ]}
    />
  );
}

// ------------------------------------------------------------------- banners
export function BookingBannersPage() {
  return (
    <BookingCrud
      title="Booking Banners"
      endpoint="bookingBanners"
      permissionKey="booking-banners"
      multipart
      filters={[{ kind: "city" }]}
      columns={[
        imgCol("image"),
        nameCol,
        { key: "targetType", label: "Target" },
        cityCol,
        { key: "order", label: "Order" },
        activeCol("active")
      ]}
      fields={[
        { name: "image", label: "Image", type: "file", required: true },
        { name: "title", label: "Title", type: "localized" },
        cityField,
        {
          name: "targetType",
          label: "Target",
          type: "select",
          options: ["NONE", "PLACE", "CATEGORY", "URL"].map(v => ({ value: v, label: v }))
        },
        { name: "placeId", label: "Place", type: "remote", remote: { endpoint: "bookingPlaces" }, help: "Used when target is PLACE" },
        { name: "categoryId", label: "Category", type: "remote", remote: { endpoint: "bookingCategories" }, help: "Used when target is CATEGORY" },
        { name: "clickUrl", label: "URL", type: "text", help: "Used when target is URL" },
        { name: "order", label: "Order", type: "number" },
        { name: "active", label: "Active", type: "bool" },
        { name: "startDate", label: "Start date", type: "datetime" },
        { name: "endDate", label: "End date", type: "datetime" }
      ]}
    />
  );
}

// ------------------------------------------------------------ payment settings
export function BookingPaymentSettingsPage() {
  return (
    <BookingCrud
      title="Booking Payment Settings"
      endpoint="bookingPaymentSettings"
      permissionKey="booking-payment-settings"
      paginated={false}
      filters={[{ kind: "city" }]}
      note="Each city has its own wallet number. The customer sees it in the app, pays by e-wallet transfer, and uploads the receipt with the booking."
      columns={[
        cityCol,
        { key: "walletType", label: "Wallet type" },
        { key: "walletNumber", label: "Wallet number" },
        { key: "accountName", label: "Account name" },
        activeCol()
      ]}
      fields={[
        { name: "cityId", label: "City", type: "remote", required: true, readOnlyOnEdit: true },
        { name: "walletType", label: "Wallet type", type: "localized", help: "e.g. Vodafone Cash / InstaPay" },
        { name: "walletNumber", label: "Wallet number", type: "text", required: true },
        { name: "accountName", label: "Account name", type: "text" },
        { name: "instructions", label: "Instructions", type: "localizedText" },
        { name: "isActive", label: "Active", type: "bool" }
      ]}
    />
  );
}
