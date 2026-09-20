import { usePluginData } from '@docusaurus/useGlobalData'
import type { SnippetsContent } from '../../plugins/snippets-plugin'

export const useSnippets = () => usePluginData('insane-forms-snippets') as SnippetsContent
