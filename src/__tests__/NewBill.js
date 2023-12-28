// Importe les modules nécessaires pour les tests
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";
import Router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store.js';

// Suite de tests pour la page NewBill lorsque l'utilisateur est connecté en tant qu'employé
describe('Given I am connected as an employee', () => {

  // Teste l'affichage de l'icône d'email vertical sur la page NewBill
  describe('When I am on the new bill page', () => {
    test('Then email icon in vertical layout should be highlighted', async () => {
      // Mocke localStorage sur l'objet window et définit un utilisateur simulé pour simuler un employé authentifié
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      // Structure HTML initiale pour le test
      document.body.innerHTML = '<div id="root"></div>';

      // Initialisation du routeur pour la navigation
      Router();

      // Navigation vers la page NewBill
      window.onNavigate(ROUTES_PATH.NewBill);

      // Attente que l'icône d'email soit disponible dans le DOM, puis vérification si elle a la classe 'active-icon'
      const mailIcon = await waitFor(() => screen.getByTestId('icon-mail'));
      expect(mailIcon.classList).toContain('active-icon');
    });
  });

  // Teste la sélection d'une image au format correct sur la page NewBill
  describe('When I am on NewBill Page and I select an image in a correct format', () => {
    test('Then the input file should display the file name', () => {
      // Mocke localStorage sur l'objet window et définit un utilisateur simulé pour simuler un employé authentifié
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      // Structure HTML initiale pour le test
      document.body.innerHTML = '<div id="root"></div>';

      // Initialisation du routeur pour la gestion de la navigation dans les tests
      Router();

      // Navigation programmée vers la page NewBill
      window.onNavigate(ROUTES_PATH.NewBill);

      // Crée une instance de la classe NewBill avec les dépendances nécessaires
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Interroge le DOM pour l'élément d'entrée de fichier et configure un gestionnaire d'événements de changement
      const fileInput = screen.getByTestId('file');
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener('change', handleChangeFile);

      // Simule un événement de sélection de fichier sur l'entrée de fichier et vérifie si le nom du fichier est correctement affiché
      fireEvent.change(fileInput, { target: { files: [new File(['image.png'], 'image.png', { type: 'image/png' })] } });
      expect(fileInput.files[0].name).toBe('image.png');

      // Vérifie que la fonction de gestion du changement a été appelée lors de la sélection du fichier
      expect(handleChangeFile).toHaveBeenCalled();
    });
  });

  // Teste l'affichage d'un message d'erreur lors de la sélection d'une image dans un format incorrect
  describe('When I am on NewBill Page and I select an image in an incorrect format', () => {
    test('Then an error message should be displayed', () => {
      // Met en place l'environnement et le DOM
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
      document.body.innerHTML = '<div id="root"></div>';
      Router();
      window.onNavigate(ROUTES_PATH.NewBill);

      // Initialise NewBill et configure l'entrée de fichier
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const fileInput = screen.getByTestId('file');
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener('change', handleChangeFile);

      // Simule la sélection de fichier avec un format incorrect et vérifie le message d'erreur
      fireEvent.change(fileInput, { target: { files: [new File(['image.txt'], 'image.txt', { type: 'image/txt' })] } });
      expect(fileInput.files[0].name).toBe('image.txt');
      const errorInput = screen.getByTestId('errorMessage');
      expect(errorInput.textContent).toBe('Invalid file type. Only .png, .jpg, .jpeg are allowed');
      expect(handleChangeFile).toHaveBeenCalled();
    });
  });

  // Teste la soumission d'une nouvelle facture
  describe('When I submit a new bill', () => {
    test('Then a bill is created', () => {
      // Mocke localStorage sur l'objet window et définit un utilisateur simulé pour simuler un employé authentifié
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

      // Structure HTML initiale pour le test
      document.body.innerHTML = '<div id="root"></div>';

      // Initialisation du routeur pour la gestion de la navigation dans les tests
      Router();

      // Navigation programmée vers la page NewBill
      window.onNavigate(ROUTES_PATH.NewBill);

      // Crée une instance de la classe NewBill avec les dépendances nécessaires
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Configure une fonction simulée pour gérer la soumission du formulaire
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      // Interroge le DOM pour l'élément de formulaire et ajoute un écouteur d'événements pour l'événement de soumission
      const submit = screen.getByTestId('form-new-bill');
      submit.addEventListener('submit', handleSubmit);

      // Simule l'événement de soumission du formulaire
      fireEvent.submit(submit);

      // Vérifie que la fonction de soumission du formulaire a été appelée lors de la soumission du formulaire
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  // Test d'intégration POST
  describe('Given I am connected as an employee', () => {
    describe('When I submit a new bill', () => {
      test('fetches bills from mock API POST', async () => {
        // Mocke la fonction POST du magasin et suit ses appels
        const postSpy = jest.spyOn(mockStore, 'bills');

        // Crée une facture avec succès en simulant l'appel à la fonction POST
        const billIsCreated = await postSpy().update();

        // Attente que la fonction postSpy soit appelée exactement une fois
        expect(postSpy).toHaveBeenCalledTimes(1);

        // Vérifie que la facture créée a l'ID spécifique '47qAXb6fIm2zOKkLzMro'
        expect(billIsCreated.id).toBe('47qAXb6fIm2zOKkLzMro');
      });

      // Fonction pour configurer et effectuer des tests pour des scénarios d'erreur
      const setupNewBillTest = async (errorCode) => {
        // Initialise l'environnement DOM pour la page NewBill
        document.body.innerHTML = `<div id="root"></div>`;
        Router();
        window.onNavigate(ROUTES_PATH.NewBill);
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

        // Mocke une réponse d'erreur pour la fonction update du magasin
        const mockedError = jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => ({
          update: () => Promise.reject(new Error(`Erreur ${errorCode}`)),
        }));

        // Attente que l'erreur soit levée comme prévu et que les propriétés de NewBill soient réinitialisées
        await expect(mockedError().update).rejects.toThrow(`Erreur ${errorCode}`);
        expect(mockedError).toHaveBeenCalled();

        // Vérifie que certaines propriétés de l'objet newBill sont nulles après l'erreur
        expect(newBill.billId).toBeNull();
        expect(newBill.fileUrl).toBeNull();
        expect(newBill.fileName).toBeNull();
      };

      // Test pour gérer une erreur 404 de l'API
      test('fetches bills from mock API POST and fails with 404 message error', async () => {
        await setupNewBillTest(404);
      });

      // Test pour gérer une erreur 500 de l'API
      test('fetches bills from mock API POST and fails with 500 message error', async () => {
        await setupNewBillTest(500);
      });
    });
  });
});

// Suite de tests unitaires pour l'extension de fichier de document de support
describe('Supporting Document Extension Test Suites', () => {
  // Teste si une extension de fichier est valide
  it('should accept a valid file extension', () => {
    const fileName = 'testFile.jpg';
    expect(NewBill.checkFileExtension(fileName)).toBe(true);
  });

  // Teste si une extension de fichier est invalide
  it('should reject an invalid file extension', () => {
    const fileName = 'testFile.svg';
    expect(NewBill.checkFileExtension(fileName)).toBe(false);
  });
});
