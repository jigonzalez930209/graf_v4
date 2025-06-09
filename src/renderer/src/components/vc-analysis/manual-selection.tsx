import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../ui/input'
import { Form } from '../ui/form'
import { Button } from '../ui/button'
import { CheckIcon } from 'lucide-react'

// Schema: array of integers
const schema = z.object({ points: z.array(z.number().int()) })

interface ManualSelectionProps {
  count: number
  onChange: (values: number[]) => void
  values: number[]
}

export const ManualSelection: React.FC<ManualSelectionProps> = ({ count, onChange, values }) => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { points: values?.length === count ? values : Array(count).fill(0) }
  })
  const { fields } = useFieldArray({ name: 'points', control: form.control })
  const onSubmit = (data: { points: number[] }) => {
    onChange(data.points)
    console.log(data.points)
  }

  React.useEffect(() => {
    // preserve existing points when count changes
    const prev = form.getValues('points') as number[]
    let updated: number[]
    if (count <= prev.length) {
      updated = prev.slice(0, count)
    } else {
      updated = [...prev, ...Array(count - prev.length).fill(0)]
    }
    form.reset({ points: updated })
  }, [count, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-row gap-3 w-full">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex flex-auto">
              <Input
                key={field.id}
                type="number"
                step="1"
                className="flex-1 w-full"
                {...form.register(`points.${idx}`, { valueAsNumber: true })}
              />
            </div>
          ))}
          <Button type="submit" variant="success" size="icon" className="self-end">
            <CheckIcon />
          </Button>
        </div>
      </form>
    </Form>
  )
}
