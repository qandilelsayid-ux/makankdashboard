import { fetchHelper } from "@/api/fetch";
import type { endpointType } from "@/utils/endpoints";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSearchParams } from "@/lib/navigation";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Select, { type MultiValue, type SingleValue } from "react-select";
import CreatableSelect from "react-select/creatable";
import { toast } from "sonner";
import {
  type ApiResponseItem,
  type Option,
  type SelectPaginatedProps,
  customStyles,
} from "./select.config";

// Define the Option type for clarity

export default function SelectPaginated({
  isMulti = false,
  value,
  placeholder,
  onChange,
  onControlChange,
  name,
  idKey = "id",
  onLabelAction,
  labelKey = "name",
  labelFormat,
  apiUrl,
  searchTermKey = "search",
  searchParamsFilter,
  searchFilters,
  disabled = false,
  allowNew = false,
  groupBy,
}: // formatCreateLabel,
  Readonly<SelectPaginatedProps>) {
  const t = useTranslations();
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const [apiOptions, setApiOptions] = useState<Option[]>([]);
  const [customOptions, setCustomOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const knownOptionsRef = useRef<Map<string, Option>>(new Map());

  useEffect(() => {
    setApiOptions([]);
  }, [searchFilters]);
  // Combine API options with custom options
  const allOptions: any = [...apiOptions, ...customOptions];
  const getLocalizedText = useCallback(
    (value: unknown) => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object") {
        const localizedValue = value as Record<string, unknown>;
        const currentLocaleValue = localizedValue[locale];
        if (typeof currentLocaleValue === "string") return currentLocaleValue;
        if (typeof localizedValue.ar === "string") return localizedValue.ar;
        if (typeof localizedValue.en === "string") return localizedValue.en;
      }

      return "";
    },
    [locale]
  );
  const getOptionLabel = useCallback(
    (item: ApiResponseItem) => {
      // Branch lists default to "Store (Branch)": most branches are just named
      // "الفرع الرئيسي", so the branch name alone can't tell stores apart.
      const effectiveFormat =
        labelFormat ?? (apiUrl?.[0] === "branches" ? "storeBranch" : undefined);
      if (effectiveFormat === "storeBranch") {
        const store = item.Store || item.store;
        const storeName = getLocalizedText(store?.name);
        const branchName = getLocalizedText(item.name);

        if (storeName && branchName) return `${storeName} (${branchName})`;
        return storeName || branchName || "Unknown";
      }

      if (labelFormat === "serviceStore") {
        const serviceName = getLocalizedText(item.name);
        const store = item.Store || item.store;
        const storeName = getLocalizedText(store?.name);

        if (serviceName && storeName) return `${serviceName} (${storeName})`;
        return serviceName || storeName || "Unknown";
      }

      if (item.currentOrder !== undefined || apiUrl?.[0] === "delivery") {
        const name = getLocalizedText(item.name || item[labelKey]);
        if (item.currentOrder) {
          const order = item.currentOrder;
          const statusText =
            order.status === "ON_THE_WAY"
              ? "في الطريق"
              : order.status === "READY_PICKUP"
              ? "جاهز للاستلام"
              : order.status === "PREPARING"
              ? "جاري التحضير"
              : order.status === "PENDING"
              ? "قيد الانتظار"
              : order.status;
          const storeInfo = order.storeName ? ` من (${order.storeName})` : "";
          return `${name} 🔴 [مشغول: طلب #${order.id}${storeInfo} - ${statusText}]`;
        }
        return `${name} 🟢 [متاح]`;
      }

      const labelValue = item[labelKey];
      return getLocalizedText(labelValue) || (typeof labelValue === "number" ? String(labelValue) : "Unknown");
    },
    [apiUrl, getLocalizedText, labelFormat, labelKey]
  );

  const displayedOptions = useMemo(() => {
    if (!groupBy) return allOptions;

    const groups: Record<string, Option[]> = {};
    allOptions.forEach(opt => {
      const groupName = opt?.group || "Other";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(opt);
    });

    return Object.keys(groups).map(group => ({
      label: group,
      options: groups[group],
    }));
  }, [allOptions, groupBy]);

  // Fetch options from the API
  const searchParams = useSearchParams();
  const fetchOptions = useCallback(
    async (isNewSearch = false) => {
      if (!apiUrl || apiUrl.length === 0) return;
      if (!hasMore && !isNewSearch) return;

      try {
        setIsLoading(true);
        const currentPage = isNewSearch ? 1 : page;

        let data = await fetchHelper({
          endPoint: apiUrl,
          revalidate: 120,
          isLocalized: true,
          tags: apiUrl,
          params: {
            ...searchParamsFilter?.reduce(
              (acc, curr) => ({ ...acc, [curr]: searchParams.get(curr) }),
              {},
            ),
            ...(searchTerm ? { [searchTermKey]: searchTerm } : {}),
            limit: "1000",
            ...searchFilters?.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}),
          },
        });
        data = onLabelAction ? onLabelAction(data) : data;
        const formattedData = Array.isArray(data?.data) ? data.data : data;
        const newOptions = Array.isArray(formattedData)
          ? formattedData?.map((item: ApiResponseItem) => {
              const opt = {
                label: getOptionLabel(item),
                value: String(item[idKey] || ""),
                icon: item.icon ?? "",
                group: groupBy ? item[groupBy] : undefined,
              };
              knownOptionsRef.current.set(opt.value, opt);
              return opt;
            })
          : [];

        // If we're doing a new search, replace options, otherwise append
        if (isNewSearch) {
          setApiOptions(newOptions);
          setPage(2); // Reset to page 2 for next fetch
        } else {
          // Combine old and new options, avoiding duplicates
          setApiOptions(prevOptions => {
            const combined = [...prevOptions];
            newOptions.forEach(newOption => {
              if (!combined.some(existing => existing.value === newOption.value)) {
                combined.push(newOption);
              }
            });
            return combined;
          });
          setPage(currentPage + 1);
        }

        // Check if we have more data to load
        setHasMore(newOptions.length > 0);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : String(error));
        if (isNewSearch) {
          setApiOptions([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      apiUrl,
      searchTerm,
      searchParams,
      searchParamsFilter,
      searchFilters,
      idKey,
      labelKey,
      getOptionLabel,
      searchTermKey,
      page,
      hasMore,
    ],
  );

  // Fetch options when component mounts
  useEffect(() => {
    fetchOptions(true);
  }, [apiUrl, searchParamsFilter, searchFilters]);

  // Handle search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOptions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle change event for single and multi-select
  const handleChange = (selected: SingleValue<Option> | MultiValue<Option>) => {
    const selectedOptions = Array.isArray(selected) ? selected : selected ? [selected] : [];
    if (selectedOptions.length == 1 && isMulti == false) {
      const v = selectedOptions[0].value;
      onChange?.(v);
      onControlChange?.(v);
    } else if (isMulti == true && selectedOptions.length > 0) {
      const v = selectedOptions.map(item => item.value);
      onChange?.(v);
      onControlChange?.(v);
    } else if (selectedOptions.length == 0 && isMulti == true) {
      onChange?.([]);
      onControlChange?.([]);
    } else if (selectedOptions.length == 0 && isMulti == false) {
      onChange?.("");
      onControlChange?.("");
    } else {
      onChange?.(selectedOptions);
      onControlChange?.(selectedOptions);
    }
  };

  // Handle creating a new option
  const handleCreateOption = (inputValue: string) => {
    const newOption = {
      label: inputValue,
      value: `${inputValue}`,
      __isNew__: true,
    };
    knownOptionsRef.current.set(newOption.value, newOption);

    setCustomOptions(prevCustomOptions => [...prevCustomOptions, newOption]);

    if (isMulti) {
      const newValue = [...(Array.isArray(value) ? value : []), newOption.value];
      // Convert string array to Option array to match the expected type
      const newOptions = newValue.map(val => ({
        label: typeof val === "string" ? val : String(val),
        value: val,
      }));
      onChange?.(newOptions);
      onControlChange?.(newOptions);
    } else {
      onChange?.(newOption.value);
      onControlChange?.(newOption.value);
    }
  };

  const SelectComponent = (allowNew ? CreatableSelect : Select) as any;

  const formatOptionLabel = (option: Option) => {
    return (
      <div className="flex items-center justify-between gap-2">
        <span>{option.label}</span>
        {option.__isNew__ && <span className="text-xs italic">(New)</span>}
        {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
      </div>
    );
  };

  // Find the selected value in the combined options list
  const selectedValue = (() => {
    if (!value) return null;

    // For single select
    if (!isMulti) {
      const exiest = allOptions.find((opt: Option) => String(opt.value) === String(value)) || knownOptionsRef.current.get(String(value));
      return exiest || null;
    }

    // For multi select
    if (Array.isArray(value)) {
      return value.map(v => allOptions.find((opt: Option) => String(opt.value) === String(v)) || knownOptionsRef.current.get(String(v))).filter(Boolean);
    }

    return null;
  })();

  // Fetch missing selected value only on first mount
  useEffect(() => {
    const fetchMissingValue = async (val: string | number) => {
      const resolvedEndPoint: endpointType = (() => {
        if (apiUrl.includes("subCategoryStore") || apiUrl.includes("storeCategories")) {
          return ["storeCategories", Number(val)];
        }
        if (apiUrl.length > 1) {
          return [apiUrl[0], Number(val)];
        }
        return [...apiUrl, Number(val)];
      })();

      const data = await fetchHelper({
        endPoint: resolvedEndPoint,
        revalidate: 60,
        isLocalized: true,
        tags: resolvedEndPoint,
      });

      const item = data?.data || data;
      if (item && !Array.isArray(item)) {
        const opt = {
          label: getOptionLabel(item),
          value: String(item[idKey]) || "",
          group: groupBy ? item[groupBy] : undefined,
        };
        knownOptionsRef.current.set(opt.value, opt);
        setApiOptions(prev => {
          if (prev.some(o => String(o.value) === String(item[idKey]))) return prev;
          return [...prev, opt];
        });
      } else if (Array.isArray(item) && item.length >= 1) {
        const firstItem = item[0];
        const opt = {
          label: getOptionLabel(firstItem),
          value: String(firstItem[idKey]) || "",
          group: groupBy ? firstItem[groupBy] : undefined,
        };
        knownOptionsRef.current.set(opt.value, opt);
        setApiOptions(prev => {
          if (prev.some(o => String(o.value) === String(firstItem[idKey]))) return prev;
          return [...prev, opt];
        });
      }
    };

    if (value) {
      if (isMulti && Array.isArray(value)) {
        value.forEach(val => {
          if (!allOptions.find((opt: Option) => String(opt.value) === String(val))) {
            fetchMissingValue(val);
          }
        });
      } else if (!isMulti && !Array.isArray(value)) {
        if (!allOptions.find((opt: Option) => String(opt.value) === String(value))) {
          fetchMissingValue(value as string | number);
        }
      }
    }
    // Only run on mount
  }, []);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | undefined>(undefined);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const isInsideDialog = !!node.closest('[role="dialog"]') || 
                            !!node.closest('.DialogContent') || 
                            !!node.closest('[data-radix-focus-guard]') ||
                            !!node.closest('.fixed');
      if (!isInsideDialog) {
        setPortalTarget(document.body);
      } else {
        setPortalTarget(undefined);
      }
    }
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col w-full gap-3">
      <SelectComponent
        isClearable
        isDisabled={disabled}
        isMulti={isMulti}
        onChange={handleChange}
        onCreateOption={allowNew ? handleCreateOption : undefined}
        options={displayedOptions}
        value={selectedValue as unknown as SingleValue<Option> | MultiValue<Option>}
        placeholder={placeholder ?? t("select")}
        name={name}
        styles={customStyles(resolvedTheme === "dark")}
        className="w-full"
        formatOptionLabel={formatOptionLabel}
        formatCreateLabel={inputValue => `Create "${inputValue}"`}
        onMenuScrollToBottom={() => {
          if (!isLoading) {
            fetchOptions(false);
          }
        }}
        isLoading={isLoading}
        onInputChange={inputValue => setSearchTerm(inputValue)}
        menuPortalTarget={portalTarget}
        menuPosition={portalTarget ? "fixed" : "absolute"}
      />
    </div>
  );
}
