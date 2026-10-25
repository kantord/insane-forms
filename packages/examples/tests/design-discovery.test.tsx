import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { ChoiceDiscovery, CollectionDiscovery } from '../design-discovery'

test('saving can accept an untouched suggestion', async () => {
  const user = userEvent.setup()
  render(<ChoiceDiscovery mode="suggested" />)
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  await waitFor(() => expect(screen.getByLabelText('Saved delivery')).toHaveTextContent('Standard'))
  expect(screen.getByTestId('choice-dirty')).toHaveTextContent('false')
})

test('a required choice rejects absence and accepts the suggested option when selected', async () => {
  const user = userEvent.setup()
  render(<ChoiceDiscovery mode="required" />)
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  expect(await screen.findByRole('alert')).toBeVisible()
  expect(screen.getByLabelText('Saved delivery')).toHaveTextContent('Not saved')
  await user.selectOptions(screen.getByLabelText('Delivery service'), 'Standard')
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  await waitFor(() => expect(screen.getByLabelText('Saved delivery')).toHaveTextContent('Standard'))
})

test('clearing a defaulted choice separates current input from parsed fallback', async () => {
  const user = userEvent.setup()
  render(<ChoiceDiscovery mode="suggested" />)
  await user.selectOptions(screen.getByLabelText('Delivery service'), '')
  expect(screen.getByTestId('choice-value')).toHaveTextContent('Unset')
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Saved delivery')).toHaveTextContent('{"delivery":"Standard"}'),
  )
  expect(screen.getByTestId('choice-value')).toHaveTextContent('Unset')
})

test('visited, changed, and explicitly confirmed are distinguishable', async () => {
  const user = userEvent.setup()
  render(<ChoiceDiscovery mode="confirmation" />)
  await user.click(screen.getByLabelText('Delivery service'))
  await user.tab()
  expect(screen.getByTestId('choice-touched')).toHaveTextContent('true')
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Confirm the selected service.')
  await user.click(screen.getByLabelText('I confirm this delivery service'))
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Saved delivery')).toHaveTextContent('"confirmed":true'),
  )
  expect(screen.getByTestId('choice-dirty')).toHaveTextContent('false')
  await user.selectOptions(screen.getByLabelText('Delivery service'), 'Express')
  expect(screen.getByLabelText('I confirm this delivery service')).not.toBeChecked()
  await user.selectOptions(screen.getByLabelText('Delivery service'), 'Standard')
  expect(screen.getByTestId('choice-dirty')).toHaveTextContent('false')
  expect(screen.getByLabelText('I confirm this delivery service')).not.toBeChecked()
})

test('confirmation is conditional and reset restores the unconfirmed baseline', async () => {
  const user = userEvent.setup()
  render(<ChoiceDiscovery mode="confirmation" />)
  await user.click(screen.getByLabelText('Require confirmation for this shipment'))
  expect(screen.queryByLabelText('I confirm this delivery service')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  await waitFor(() => expect(screen.getByLabelText('Saved delivery')).toHaveTextContent('Standard'))
  await user.click(screen.getByLabelText('Require confirmation for this shipment'))
  await user.click(screen.getByLabelText('I confirm this delivery service'))
  await user.selectOptions(screen.getByLabelText('Delivery service'), 'Express')
  await user.click(screen.getByLabelText('I confirm this delivery service'))
  await user.tab()
  expect(screen.getByLabelText('I confirm this delivery service')).toBeChecked()
  expect(screen.getByTestId('choice-dirty')).toHaveTextContent('true')
  await user.click(screen.getByRole('button', { name: 'Reset delivery' }))
  expect(screen.getByLabelText('I confirm this delivery service')).not.toBeChecked()
  expect(screen.getByTestId('choice-value')).toHaveTextContent('Standard')
  expect(screen.getByTestId('choice-dirty')).toHaveTextContent('false')
  expect(screen.getByTestId('choice-touched')).toHaveTextContent('false')
  expect(screen.getByLabelText('Saved delivery')).toHaveTextContent('Not saved')
})

test('hidden confirmation is retained until a user changes its dependency', async () => {
  const user = userEvent.setup()
  render(<ChoiceDiscovery mode="confirmation" />)
  await user.click(screen.getByLabelText('I confirm this delivery service'))
  await user.click(screen.getByLabelText('Require confirmation for this shipment'))
  await user.click(screen.getByLabelText('Require confirmation for this shipment'))
  expect(screen.getByLabelText('I confirm this delivery service')).toBeChecked()
  await user.click(screen.getByLabelText('Require confirmation for this shipment'))
  await user.selectOptions(screen.getByLabelText('Delivery service'), 'Express')
  await user.click(screen.getByLabelText('Require confirmation for this shipment'))
  expect(screen.getByLabelText('I confirm this delivery service')).not.toBeChecked()
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Confirm the selected service.')
  expect(screen.getByLabelText('Saved delivery')).toHaveTextContent('Not saved')
})

test('characterization of policy gap: confirming an unset display can submit a schema fallback', async () => {
  const user = userEvent.setup()
  render(<ChoiceDiscovery mode="confirmation" />)
  await user.selectOptions(screen.getByLabelText('Delivery service'), '')
  expect(screen.getByTestId('choice-value')).toHaveTextContent('Unset')
  expect(screen.getByLabelText('I confirm this delivery service')).not.toBeChecked()
  await user.click(screen.getByLabelText('I confirm this delivery service'))
  await user.click(screen.getByRole('button', { name: 'Save delivery' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Saved delivery')).toHaveTextContent(
      '{"delivery":"Standard","needsConfirmation":true,"confirmed":true}',
    ),
  )
  expect(screen.getByTestId('choice-value')).toHaveTextContent('Unset')
  // This records an unresolved interaction between fallback and confirmation;
  // it does not establish that confirming an unseen default is the desired UX.
})

test('current gated controls stop at submission bounds', async () => {
  const user = userEvent.setup()
  render(<CollectionDiscovery mode="gated" />)
  expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /^add$/i }))
  expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument()
})

test('free editing permits invalid lengths while preserving real collection counts', async () => {
  const user = userEvent.setup()
  render(<CollectionDiscovery mode="free" />)
  for (let i = 0; i < 2; i++)
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
  expect(screen.getByTestId('traveller-count')).toHaveTextContent('0')
  expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Save trip' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'At least two travellers are required.',
  )
  expect(screen.getByLabelText('Saved trip')).toHaveTextContent('Not saved')
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole('button', { name: /^add$/i }))
    const input = screen.getAllByRole('textbox', { name: /traveller/i })[i]
    await user.clear(input)
    await user.type(input, `New ${i + 1}`)
  }
  expect(screen.getByTestId('traveller-count')).toHaveTextContent('4')
  await user.click(screen.getByRole('button', { name: 'Save trip' }))
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('At most three travellers can be saved.'),
  )
  expect(screen.getByLabelText('Saved trip')).toHaveTextContent('Not saved')
  await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
  await user.click(screen.getByRole('button', { name: 'Save trip' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Saved trip')).toHaveTextContent(
      '{"travellers":[{"name":"New 2"},{"name":"New 3"},{"name":"New 4"}]}',
    ),
  )
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('characterization of initialization gap: appended rows can reuse removed caller defaults', async () => {
  const user = userEvent.setup()
  render(<CollectionDiscovery mode="free" />)
  for (let i = 0; i < 2; i++)
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
  expect(screen.getByLabelText('Current travellers')).toHaveTextContent('[]')
  await user.click(screen.getByRole('button', { name: /^add$/i }))
  await user.click(screen.getByRole('button', { name: /^add$/i }))
  // The leaf schema says Guest, but the consuming form's initial values still
  // occupy these paths in RHF's default baseline. This is observed behavior,
  // not the desired template policy for newly created travellers.
  expect(screen.getAllByRole('textbox', { name: /traveller/i })[0]).toHaveValue('Ada')
  expect(screen.getAllByRole('textbox', { name: /traveller/i })[1]).toHaveValue('Bea')
  await user.click(screen.getByRole('button', { name: 'Save trip' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Saved trip')).toHaveTextContent(
      '{"travellers":[{"name":"Ada"},{"name":"Bea"}]}',
    ),
  )
})

test('characterization of known gap: schema default rows currently become an empty array', async () => {
  const user = userEvent.setup()
  render(<CollectionDiscovery mode="schema-default" />)
  expect(screen.getByTestId('traveller-count')).toHaveTextContent('0')
  await user.click(screen.getByRole('button', { name: 'Save trip' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Saved trip')).toHaveTextContent('{"travellers":[]}'),
  )
})
