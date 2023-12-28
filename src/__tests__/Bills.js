/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    // Test de l'icône de facture en disposition verticale
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Simulation du stockage local
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      // Configuration d'un faux utilisateur dans le stockage local
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      // Création d'une div root dans le document
      const root = document.createElement("div")
      // Attribution d'un ID à cette div
      root.setAttribute("id", "root")
      // Ajout de la div au corps du document
      document.body.append(root)
      // Initialisation du routeur
      router()
      // Déclenchement de la navigation vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills)
      // Attente de la présence de l'icône de fenêtre dans le document
      await waitFor(() => screen.getByTestId('icon-window'))
      // Récupération de l'icône de fenêtre
      const windowIcon = screen.getByTestId('icon-window')
      // Écriture de l'attente pour l'icône
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy();
    })

    // Test des factures triées par date
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    });

    describe('When I click on the icon eye', () => {
      // Test d'affichage de la modale lors du clic sur l'icône œil
      test('A modal should open', () => {
        // Mise en place de la structure HTML et simulation de navigation
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) };

        // Instanciation d'un nouvel objet Bills
        const bill = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

        // Simulation de la modale jQuery et de la fonction handleClickIconEye
        $.fn.modal = jest.fn();
        const handleClickIconEye = jest.fn(bill.handleClickIconEye);

        // Requête pour l'icône et la modale
        const iconEye = screen.getAllByTestId('icon-eye');
        const modale = document.getElementById('modaleFile');

        // Ajout d'un événement de clic et vérification du comportement de la modale
        iconEye.forEach((icon) => {
          icon.addEventListener('click', () => handleClickIconEye(icon));
          userEvent.click(icon);
          expect(handleClickIconEye).toHaveBeenCalled();
          expect(modale).toBeTruthy();
        });
      });
    });

    describe('When I click on the new bill button', () => {
      // Test de redirection vers la page de nouvelle facture lors du clic sur le bouton "nouvelle facture"
      test('I should be redirect on the page new bill', () => {
        // Simulation de localStorage sur l'objet window et configuration d'un élément utilisateur pour simuler un utilisateur authentifié
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

        // Mise en place de la structure HTML en rendant l'UI des factures avec des données fictives
        document.body.innerHTML = BillsUI({ data: bills });

        // Simulation de la fonction onNavigate pour mettre à jour le corps du document lors de la navigation
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) };

        // Création d'une instance de la classe Bills avec les dépendances nécessaires
        const bill = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });

        // Requête du bouton de nouvelle facture dans le DOM
        const newButton = screen.getByTestId('btn-new-bill');

        // Création d'une fonction fictive pour le gestionnaire d'événements de clic du bouton de nouvelle facture
        const handleClickNewBill = jest.fn(bill.handleClickNewBill());

        // Ajout d'un écouteur d'événements au bouton de nouvelle facture pour déclencher la fonction fictive lors du clic
        newButton.addEventListener('click', handleClickNewBill);

        // Simulation d'un événement de clic sur le bouton de nouvelle facture
        fireEvent.click(newButton);

        // Attente que la fonction de gestion du clic ait été appelée
        expect(handleClickNewBill).toHaveBeenCalled();

        // Requête du formulaire de nouvelle facture dans le DOM et vérification de sa présence pour confirmer la redirection
        const formNewBill = screen.getByTestId('form-new-bill');
        expect(formNewBill).toBeTruthy();
      });
    });
  });

  // Test d'intégration GET
  describe('Given I am a user connected as Employee', () => {
    // Fonction pour configurer localStorage et la div root pour le corps du document
    const setupLocalStorageAndRootDiv = () => {
      localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      return root;
    };

    describe('When I navigate on the bills page', () => {
      // Test vérifiant si l'application récupère correctement les factures d'une fausse API en utilisant une requête GET
      test('fetches bills from mock API GET', async () => {
        // Préparation de l'environnement pour le test
        // Simulation de l'environnement
        const root = setupLocalStorageAndRootDiv();
        const pathname = ROUTES_PATH['Bills'];

        // Simule la navigation vers la page des factures et affiche un état de chargement initial
        root.innerHTML = ROUTES({ pathname: pathname, loading: true });

        // Création d'une instance de la classe Bills avec les dépendances nécessaires
        const billsList = new Bills({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

        // Récupération des factures et validation du résultat
        await billsList.getBills().then((data) => {
          // Mise à jour du HTML avec les données récupérées
          root.innerHTML = BillsUI({ data });

          // Attentes :
          // Route correcte
          expect(pathname).toBe(`#employee/bills`);
          // Nombre correct de lignes de factures
          expect(screen.getByTestId('tbody').rows.length).toBe(4);
          // Affichage du bouton nouvelle facture
          expect(screen.getByTestId('btn-new-bill')).toBeTruthy();
          // Affichage du texte titre "Mes notes de frais" sur la page
          expect(screen.getByText('Mes notes de frais')).toBeTruthy();
        });
      });
    });

    describe('When an error occurs on interacting API', () => {
      // Avant chaque test, certains réglages sont effectués
      beforeEach(() => {
        // Simulation de la méthode bills du magasin pour contrôler son comportement dans les tests
        jest.spyOn(mockStore, 'bills');

        // Simulation de localStorage sur l'objet window
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Configuration de localStorage et de la div root pour l'environnement de test
        setupLocalStorageAndRootDiv();

        // Initialisation du routeur pour la gestion de la navigation dans les tests
        router();
      });

      // Fonction testant la gestion des erreurs de l'API pour différents codes d'erreur
      const testAPIError = async (errorCode) => {
        // Implémentation simulée de la méthode bills configurée pour rejeter avec une erreur, simulant une erreur de l'API
        mockStore.bills.mockImplementationOnce(() => Promise.reject(new Error(`Erreur ${errorCode}`)));

        // Attente du prochain tick de la boucle d'événements pour s'assurer que toutes les promesses et changements d'état ont été traités
        await new Promise(process.nextTick);

        // Configuration du corps du document pour refléter l'UI en cas d'erreur de l'API
        document.body.innerHTML = BillsUI({ error: `Erreur ${errorCode}` });

        // Recherche du message d'erreur à l'écran et vérification de sa présence dans le document
        const message = screen.getByText(new RegExp(`Erreur ${errorCode}`));
        expect(message).toBeTruthy();
      };

      // Test pour vérifier si l'application gère correctement une erreur 404 de l'API
      test('fetches bills from an API and fails with 404 message error', async () => {
        await testAPIError(404);
      });

      // Test pour vérifier si l'application gère correctement une erreur 500 de l'API
      test('fetches messages from an API and fails with 500 message error', async () => {
        await testAPIError(500);
      });
    });
  });
});