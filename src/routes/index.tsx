import { createFileRoute } from '@tanstack/react-router';
import { CreditCardIcon } from '@primer/octicons-react';
import { Button, Stack } from '@primer/react';
import { Blankslate, UnderlinePanels } from '@primer/react/experimental';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  return (
    <>
      <header className='h-14 border-b border-b-(--borderColor-default)'></header>
      <main className='mx-auto max-w-7xl px-4 pt-8'>
        <UnderlinePanels aria-label='Select a tab'>
          <UnderlinePanels.Tab>Account</UnderlinePanels.Tab>
          <UnderlinePanels.Tab>Billing</UnderlinePanels.Tab>
          <UnderlinePanels.Tab>Settings</UnderlinePanels.Tab>
          <UnderlinePanels.Panel className='p-4!'>
            <Stack direction='horizontal'>
              <Button variant='danger'>Button</Button>
              <Button variant='primary'>Button</Button>
              <Button variant='invisible'>Button</Button>
            </Stack>
            {/* <div className='flex items-center gap-3 mb-2'>
              <Button variant='danger'>Button</Button>
              <Button variant='primary'>Button</Button>
              <Button variant='invisible'>Button</Button>
            </div> */}
          </UnderlinePanels.Panel>
          <UnderlinePanels.Panel className='p-4!'>
            <Blankslate>
              <Blankslate.Visual>
                <CreditCardIcon size='medium' />
              </Blankslate.Visual>
              <Blankslate.Heading>No organisation found</Blankslate.Heading>
              <Blankslate.Description>
                Billing is only supported for organisations. To enable billing
                features, you’ll need to create or join an organisation first.
              </Blankslate.Description>
              <Blankslate.PrimaryAction href='#'>
                Add Organisation
              </Blankslate.PrimaryAction>
            </Blankslate>
          </UnderlinePanels.Panel>
          <UnderlinePanels.Panel className='p-4!'>
            Panel 3
          </UnderlinePanels.Panel>
        </UnderlinePanels>
      </main>
    </>
  );
}
