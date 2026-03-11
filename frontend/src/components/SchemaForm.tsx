import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { SchemaField } from "@/schemas/dnsSchema"
import { getValueAtPath, setValueAtPath, SELECT_EMPTY_VALUE } from "@/schemas/dnsSchema"

function arrToStr(arr: string[] | undefined): string {
  return Array.isArray(arr) ? arr.join("\n") : ""
}
function strToArr(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
}

type SchemaFormProps = {
  schema: SchemaField[]
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export function SchemaForm({ schema, data, onChange }: SchemaFormProps) {
  const handleChange = React.useCallback(
    (path: string, value: unknown) => {
      const next = setValueAtPath(data, path, value)
      onChange(next)
    },
    [data, onChange]
  )

  return (
    <div className="grid gap-4">
      {schema.map((field) => {
        const path = field.path ?? field.key
        const value = getValueAtPath(data, path)
        const id = `dns-${path.replace(/\./g, "-")}`

        if (field.type === "string") {
          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={id}>{field.label}</Label>
              <Input
                id={id}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => handleChange(path, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          )
        }
        if (field.type === "number") {
          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={id}>{field.label}</Label>
              <Input
                id={id}
                type="number"
                value={typeof value === "number" ? value : ""}
                onChange={(e) => {
                  const v = e.target.value
                  handleChange(path, v === "" ? 0 : Number(v))
                }}
                placeholder={field.placeholder}
              />
            </div>
          )
        }
        if (field.type === "boolean") {
          return (
            <div key={field.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={id}>{field.label}</Label>
              <Switch
                id={id}
                checked={value === true}
                onCheckedChange={(checked: boolean) => handleChange(path, checked)}
              />
            </div>
          )
        }
        if (field.type === "select") {
          const strVal = typeof value === "string" ? value : ""
          const options = field.options
          const hasEmptyOption = options.some((o) => o.value === SELECT_EMPTY_VALUE)
          const selectedValue = options.some((o) => o.value === strVal)
            ? strVal
            : hasEmptyOption && (strVal === "" || value === undefined)
              ? SELECT_EMPTY_VALUE
              : (options[0]?.value ?? "")
          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={id}>{field.label}</Label>
              <Select
                value={selectedValue}
                onValueChange={(v) =>
                  handleChange(path, v === SELECT_EMPTY_VALUE ? undefined : v)
                }
              >
                <SelectTrigger id={id}>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem
                      key={opt.value === SELECT_EMPTY_VALUE ? "__empty__" : opt.value}
                      value={opt.value}
                    >
                      {opt.label ?? (opt.value === SELECT_EMPTY_VALUE ? "（空）" : opt.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
        if (field.type === "array") {
          const arr = Array.isArray(value) ? (value as string[]).map(String) : []
          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={id}>{field.label}</Label>
              <textarea
                id={id}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={arrToStr(arr)}
                onChange={(e) => handleChange(path, strToArr(e.target.value))}
                placeholder={field.placeholder}
              />
            </div>
          )
        }
        if (field.type === "password") {
          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={id}>{field.label}</Label>
              <PasswordInput
                id={id}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => handleChange(path, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
