import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { CategoryForm, ProfileForm, type Cat, type ProfileData } from '../examples/profile'

/* The full worked examples — the same fixtures the automated suite renders. */
const meta: Meta = {
  title: 'Forms',
}
export default meta

const ProfileStory = () => {
  const [out, setOut] = useState<ProfileData | null>(null)
  return (
    <>
      <ProfileForm onSubmit={setOut} />
      {out && <pre>{JSON.stringify(out, null, 2)}</pre>}
    </>
  )
}

export const Profile: StoryObj = {
  render: () => <ProfileStory />,
}

const TreeStory = () => {
  const [out, setOut] = useState<Cat | null>(null)
  return (
    <>
      <CategoryForm
        value={{ name: 'root', children: [{ name: 'docs', children: [{ name: 'api', children: [] }] }] }}
        onSubmit={setOut}
      />
      {out && <pre>{JSON.stringify(out, null, 2)}</pre>}
    </>
  )
}

export const RecursiveTree: StoryObj = {
  render: () => <TreeStory />,
}
