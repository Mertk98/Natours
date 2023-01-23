/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51MRP8gExpcp9pKaEjB7OYGc7tiCPnHILmkm0prUeWkEJP7oEEpapa0tCS80uqsZq8LLRcOuwjcYxdAJLLRBxn9YI00eLZoZkx3'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get Checkout session from API
    const session = await axios(
      `http://127.0.0.1:8080/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
