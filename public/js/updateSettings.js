/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// To be updated with new features
// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'api/v1/users/updateMyPassword'
        : 'api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:8080/${url}`,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `User ${type} updated successfully`);
      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
