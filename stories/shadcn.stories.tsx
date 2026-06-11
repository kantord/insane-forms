import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { DeepPartial } from 'react-hook-form'
import * as z from 'zod'
import '../examples/shadcn/globals.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ShadCheck,
  ShadNumber,
  ShadText,
  ShadcnListBox,
  shadSelect,
} from '../examples/shadcn/fields'
import * as insane from '../src'

/* The original pitch — "jsonforms, but for shadcn/ui" — demonstrated: the same
 * core and the same schema style, rendered entirely through shadcn (Base UI)
 * components installed with the official CLI. */
const meta: Meta = {
  title: 'Shadcn UI',
  // Opt out of the bureau-paper decorator; fullscreen lets the clean canvas cover the body.
  parameters: { bureau: false, layout: 'fullscreen' },
}
export default meta

function ShadDemo<S extends z.ZodType>({
  schema,
  defaults,
}: {
  schema: S
  defaults?: DeepPartial<z.input<S>> & object
}) {
  const [out, setOut] = useState<z.output<S> | undefined>(undefined)
  return (
    <div className="flex flex-col gap-6 font-sans text-foreground [&>form]:flex [&>form]:flex-col [&>form]:gap-5">
      <insane.ZodForm schema={schema} defaults={defaults} onSubmit={setOut}>
        <Button type="submit" className="self-start">
          Save
        </Button>
      </insane.ZodForm>
      {out !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              z.output — parsed &amp; typed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto text-xs">{JSON.stringify(out, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const Contact = insane.group({
  email: ShadText.email().meta({ title: 'Email' }),
  primary: ShadCheck.meta({ title: 'Primary' }),
})

const Account = insane.group(<h3 className="text-lg font-semibold">Account</h3>, {
  id: insane.hidden(z.string().default('srv-000')),
  name: ShadText.min(2).meta({ title: 'Name' }),
  email: ShadText.email().meta({ title: 'Email', description: 'We never share it' }),
})

const Details = insane.group(<h3 className="text-lg font-semibold">Profile</h3>, {
  age: ShadNumber.int().min(18).default(18).meta({ title: 'Age' }),
  role: shadSelect(z.enum(['admin', 'user', 'guest']).default('user').meta({ title: 'Role' })),
  newsletter: ShadCheck.meta({ title: 'Newsletter' }),
  nickname: ShadText.optional(),
  contacts: insane
    .list(Contact, { wrapper: ShadcnListBox })
    .min(1)
    .max(3)
    .meta({ title: 'Contacts' }),
})

const ShadProfile = insane.group(Account, <Separator />, Details)

export const Profile: StoryObj = {
  name: 'Profile — same schema style, shadcn skin',
  render: () => <ShadDemo schema={ShadProfile} defaults={{ contacts: [{}] }} />,
}

export const Widgets: StoryObj = {
  name: 'Every widget, one form',
  render: () => (
    <ShadDemo
      schema={insane.group({
        text: ShadText.min(2).meta({ title: 'Text' }),
        number: ShadNumber.int().default(0).meta({ title: 'Number' }),
        check: ShadCheck.meta({ title: 'Checkbox' }),
        choice: shadSelect(z.enum(['draft', 'published']).default('draft').meta({ title: 'Select' })),
      })}
    />
  ),
}

export const BoundedList: StoryObj = {
  name: 'Card list — bounds from the schema',
  render: () => (
    <ShadDemo
      schema={insane.group({
        tags: insane
          .list(insane.group({ label: ShadText.min(1).meta({ title: 'Label' }) }), {
            wrapper: ShadcnListBox,
          })
          .min(1)
          .max(3)
          .meta({ title: 'Tags' }),
      })}
      defaults={{ tags: [{}] }}
    />
  ),
}
