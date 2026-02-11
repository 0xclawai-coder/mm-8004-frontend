import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="mt-auto w-full">
      <Separator className="opacity-50" />
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Built on{' '}
          <span className="font-medium text-foreground">Monad</span>
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a
            href="https://eips.ethereum.org/EIPS/eip-8004"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            EIP-8004 Spec
          </a>
          <a
            href="https://www.monad.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Monad
          </a>
        </div>
      </div>
    </footer>
  )
}
