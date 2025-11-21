import React from 'react'
import { useForm, useFieldArray, FieldValues, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../../ui/input'
import { Form } from '../../ui/form'
import { Button } from '../../ui/button'
import { CheckIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'

// Schema: array of integers
const schema = z.object({ points: z.array(z.number().int()), degree: z.number().int() })
interface FormValues extends FieldValues {
  points: z.infer<typeof schema>['points']
  degree: z.infer<typeof schema>['degree']
}

interface ManualSelectionProps {
  count: number
  onChange: (values: number[], degree: number) => void
  values: number[]
  degree: number
}

export const ManualSelection: React.FC<ManualSelectionProps> = ({
  count,
  onChange,
  values,
  degree
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      points: values?.length === count ? values : Array(count).fill(0),
      degree: degree
    }
  })
  const { fields } = useFieldArray<FormValues, 'points'>({ name: 'points', control: form.control })
  const onSubmit = (data: FormValues) => {
    // Ensure points is a number array
    const points = data.points || []
    onChange(points, data.degree)
    console.log(points)
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
    form.reset({ points: updated, degree: degree }) // Fix type error by including all required fields in form reset
  }, [count, form, degree])

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
                {...form.register(`points.${idx}` as `points.${number}`, { valueAsNumber: true })}
              />
            </div>
          ))}
          <Controller
            name="degree"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value.toString()}
                onValueChange={(val) => field.onChange(parseInt(val, 10))}
              >
                <SelectTrigger className="w-20 min-w-20 max-w-20">
                  <SelectValue>{field.value === 0 ? 'Auto' : field.value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => i).map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d === 0 ? 'Auto' : d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Button type="submit" variant="success" size="icon" className="self-end">
            <CheckIcon />
          </Button>
        </div>
      </form>
    </Form>
  )
}
