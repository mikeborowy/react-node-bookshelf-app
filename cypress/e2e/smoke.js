import {buildUser} from '../support/generate'

describe('smoke', () => {
  it('should allow user to login', () => {
    const user = buildUser()
    cy.visit('/')

    cy.findByRole('button', {name: /register/i}).click()

    cy.findByRole('dialog').within(() => {
      cy.findByRole('textbox', {name: /username/i}).type(user.username)
      cy.findByLabelText(/password/i).type(user.password)
      cy.findByRole('button', {name: /register/i}).click()
    })
  })

  it('should allow user navigate to discovery page and search book and add to reading list', () => {
    cy.findByRole('navigation').within(() => {
      cy.findByRole('link', {name: /discover/i}).click()
    })

    cy.findByRole('main').within(() => {
      cy.findByRole('searchbox', {name: /search/i}).type('Voice of war{enter}')
      cy.findByRole('listitem', {name: /voice of war/i}).within(() => {
        cy.findByRole('button', {name: /add to list/i}).click()
      })
    })
  })

  it('should allow user to check if bokk is in reading list', () => {
    cy.findByRole('navigation').within(() => {
      cy.findByRole('link', {name: /reading list/i}).click()
    })

    cy.findByRole('main').within(() => {
      cy.findAllByRole('listitem').should('have.length', 1)
      cy.findByRole('link', {name: /voice of war/i}).click()
    })
  })

  it('should allow user to type a note and add mark as read', () => {
    cy.findByRole('textbox', {name: /notes/i}).type('This is an awesome book')
    cy.findByLabelText(/loading/i).should('exist')
    cy.findByLabelText(/loading/i).should('not.exist')

    cy.findByRole('button', {name: /mark as read/i}).click()
    // the radio buttons are fancy and the inputs themselves are visually hidden
    // in favor of nice looking stars, so we have to force the click.
    cy.findByRole('radio', {name: /5 stars/i}).click({force: true})
  })

  it('should allow user to check book rating and note in finished list', () => {
    cy.findByRole('navigation').within(() => {
      cy.findByRole('link', {name: /finished books/i}).click()
    })

    cy.findByRole('main').within(() => {
      cy.findAllByRole('listitem').should('have.length', 1)
      cy.findByRole('radio', {name: /5 stars/i}).should('be.checked')
      cy.findByRole('link', {name: /voice of war/i}).click()
    })
  })

  it('should allow user to remove book from list', () => {
    cy.findByRole('button', {name: /remove from list/i}).click()
    cy.findByRole('textbox', {name: /notes/i}).should('not.exist')
    cy.findByRole('radio', {name: /5 stars/i}).should('not.exist')

    cy.findByRole('navigation').within(() => {
      cy.findByRole('link', {name: /finished books/i}).click()
    })

    cy.findByRole('main').within(() => {
      cy.findAllByRole('listitem').should('have.length', 0)
    })
  })
})
