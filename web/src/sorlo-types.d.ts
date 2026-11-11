// Generated from the CMS by `npx sorlo types pull`. Pull again rather than editing it.

import type { Entry, Linked, Media } from '@sorlo/sdk'

export type GroupSeo = {
  title?: string
  description?: string
  image?: string
}

export type GroupSeoResolved<Depth extends number> = {
  title?: string
  description?: string
  image?: Media | null
}

export type AuthorsValues = {
  name: string
  bio?: string
  avatar?: string
}

export type AuthorsResolvedValues<Depth extends number> = {
  avatar?: Media | null
}

export type EntryAuthors = Omit<Entry, 'type' | 'slug' | 'uri' | 'parentId' | 'position' | 'values'> & {
  type: "authors"
  slug: null
  uri: null
  parentId: null
  position: null
  values: AuthorsValues
}

export type PagesValues = {
  title: string
  slug: string
  blocks?: Array<{ _layout: "hero" } & {
    heading: string
    text?: string
    image?: string
  } | { _layout: "text" } & {
    body: string
  } | { _layout: "image" } & {
    image: string
  } | { _layout: "call_to_action" } & {
    heading: string
    text?: string
    label: string
    link: string
  } | { _layout: "form" } & {
    heading?: string
    form: string
  }>
  seo?: GroupSeo
}

export type PagesResolvedValues<Depth extends number> = {
  blocks?: Array<{ _layout: "hero" } & {
    heading: string
    text?: string
    image?: Media | null
  } | { _layout: "text" } & {
    body: string
  } | { _layout: "image" } & {
    image: Media | null
  } | { _layout: "call_to_action" } & {
    heading: string
    text?: string
    label: string
    link: string
  } | { _layout: "form" } & {
    heading?: string
    form: string
  }>
  seo?: GroupSeoResolved<Depth>
}

export type EntryPages = Omit<Entry, 'type' | 'slug' | 'uri' | 'parentId' | 'position' | 'values'> & {
  type: "pages"
  slug: string
  uri: string
  parentId: string | null
  position: number
  values: PagesValues
}

export type PostsValues = {
  title: string
  slug: string
  published_at: string
  author?: string
  cover?: string
  excerpt?: string
  body?: string
  seo?: GroupSeo
}

export type PostsResolvedValues<Depth extends number> = {
  author?: Linked<EntryAuthors, Depth> | null
  cover?: Media | null
  seo?: GroupSeoResolved<Depth>
}

export type EntryPosts = Omit<Entry, 'type' | 'slug' | 'uri' | 'parentId' | 'position' | 'values'> & {
  type: "posts"
  slug: string
  uri: null
  parentId: null
  position: null
  values: PostsValues
}

export type SettingsValues = {
  name: string
  navigation?: Array<{
    label: string
    link: string
  }>
}

export type SettingsResolvedValues<Depth extends number> = {}

export type EntrySettings = Omit<Entry, 'type' | 'slug' | 'uri' | 'parentId' | 'position' | 'values'> & {
  type: "settings"
  slug: null
  uri: null
  parentId: null
  position: null
  values: SettingsValues
}

export type ContactFormValues = {
  name: string
  email: string
  message: string
}

declare module '@sorlo/sdk' {
  interface EntryTypes {
    authors: EntryAuthors
    pages: EntryPages
    posts: EntryPosts
    settings: EntrySettings
  }
  interface ResolvedTypes<Depth extends number> {
    authors: AuthorsResolvedValues<Depth>
    pages: PagesResolvedValues<Depth>
    posts: PostsResolvedValues<Depth>
    settings: SettingsResolvedValues<Depth>
  }
  interface FormTypes {
    contact: ContactFormValues
  }
  interface DeliverySettings {
    depth: 2
  }
}
