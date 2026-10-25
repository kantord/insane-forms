// @code-panel:source ../../../packages/examples/design-discovery.tsx
import { ChoiceDiscovery, CollectionDiscovery } from '@insane-forms/examples/design-discovery'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

const meta: Meta = {
  title: 'Examples/Design discovery',
  parameters: {
    docs: {
      description: {
        component:
          'Contrasting application examples that expose design choices and current gaps. These are not new core defaults.',
      },
    },
  },
}
export default meta

export const SuggestedChoice: StoryObj = {
  name: 'Save accepts a suggested choice',
  render: () => {
    return <ChoiceDiscovery mode="suggested" />
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save delivery' }))
    await expect(canvas.getByLabelText('Saved delivery')).toHaveTextContent('Standard')
  },
}

export const RequiredChoice: StoryObj = {
  name: 'Choose before saving',
  render: () => {
    return <ChoiceDiscovery mode="required" />
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save delivery' }))
    await expect(canvas.getByRole('alert')).toBeVisible()
    await userEvent.selectOptions(canvas.getByLabelText('Delivery service'), 'Standard')
    await userEvent.click(canvas.getByRole('button', { name: 'Save delivery' }))
    await expect(canvas.getByLabelText('Saved delivery')).toHaveTextContent('Standard')
  },
}

export const ConditionalConfirmation: StoryObj = {
  name: 'Confirm even the suggested choice',
  render: () => {
    return <ChoiceDiscovery mode="confirmation" />
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save delivery' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('Confirm the selected service.')
    await userEvent.click(canvas.getByLabelText('I confirm this delivery service'))
    await userEvent.click(canvas.getByRole('button', { name: 'Save delivery' }))
    await expect(canvas.getByLabelText('Saved delivery')).toHaveTextContent('"confirmed":true')
    await expect(canvas.getByTestId('choice-dirty')).toHaveTextContent('false')
  },
}

export const ConstrainedCollection: StoryObj = {
  name: 'Collection controls follow submission bounds',
  render: () => {
    return <CollectionDiscovery mode="gated" />
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByTestId('traveller-count')).toHaveTextContent('2')
    await expect(canvas.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /^add$/i }))
    await expect(canvas.getByTestId('traveller-count')).toHaveTextContent('3')
    await expect(canvas.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument()
  },
}

export const FreeCollection: StoryObj = {
  name: 'Edit freely and validate on save',
  render: () => {
    return <CollectionDiscovery mode="free" />
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole('button', { name: /remove/i })[0])
    await userEvent.click(canvas.getAllByRole('button', { name: /remove/i })[0])
    await expect(canvas.getByTestId('traveller-count')).toHaveTextContent('0')
    await expect(canvas.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Save trip' }))
    await expect(canvas.getByRole('alert')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /^add$/i }))
    await expect(canvas.getByTestId('traveller-count')).toHaveTextContent('1')
  },
}

export const SchemaDefaultCollection: StoryObj = {
  name: 'Schema default rows — current initialization gap',
  parameters: {
    docs: {
      description: {
        story:
          'Characterization of a known gap: the schema declares Ada as its default row, but the current array binding starts empty. The empty submission is observed behavior, not the desired contract.',
      },
    },
  },
  render: () => {
    return <CollectionDiscovery mode="schema-default" />
  },
  // A known-gap characterization, not approval of this initialization behavior.
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByTestId('traveller-count')).toHaveTextContent('0')
    await userEvent.click(canvas.getByRole('button', { name: 'Save trip' }))
    await expect(canvas.getByLabelText('Saved trip')).toHaveTextContent('{"travellers":[]}')
  },
}
