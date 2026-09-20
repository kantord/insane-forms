import { MeadowForm, type RsvpData } from '@insane-forms/examples/meadow'
import { type ProfileData, ProfileForm } from '@insane-forms/examples/profile'
import { TerminalTreeForm, type TreeNode } from '@insane-forms/examples/terminal'
import { memo, useState } from 'react'
import { Receipt } from './Receipt'

export const BureauDemo = memo(() => {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  return (
    <>
      <ProfileForm onSubmit={setProfile} />
      {profile && <Receipt data={profile} />}
    </>
  )
})

const INITIAL_TREE: TreeNode = {
  name: 'root',
  children: [{ name: 'docs', children: [{ name: 'api', children: [] }] }],
}

export const TerminalDemo = memo(() => {
  const [tree, setTree] = useState<TreeNode | null>(null)
  return (
    <>
      <TerminalTreeForm value={INITIAL_TREE} onSubmit={setTree} />
      {tree && <Receipt data={tree} />}
    </>
  )
})

export const MeadowDemo = memo(() => {
  const [rsvp, setRsvp] = useState<RsvpData | null>(null)
  return (
    <>
      <MeadowForm onSubmit={setRsvp} />
      {rsvp && <Receipt data={rsvp} />}
    </>
  )
})
