const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export const formatDateTime = (isoDate: string) => dateTimeFormatter.format(new Date(isoDate))
