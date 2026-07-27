import type { MDXComponents } from 'mdx/types'
import { CopyPre } from '@/components/copy-pre'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: (props) => <CopyPre {...props} />,
    ...components,
  }
}
