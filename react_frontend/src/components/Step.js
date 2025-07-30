import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';

const Step = () => {
  const { todoId } = useParams();
  const [steps, setSteps] = useState([]);
  const [stepName, setStepName] = useState('');
  const [todoName, setTodoName] = useState('To Do App');
  const [isLoading, setIsLoading] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [updateStepName, setUpdateStepName] = useState('');

  // Get cookie function
  const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  // Load todo details
  const loadTodo = async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.TODO_BY_ID(todoId));
      if (response.ok) {
        const data = await response.json();
        setTodoName(data.name);
      } else {
        console.error('Failed to load todo:', await response.text());
      }
    } catch (error) {
      console.error('Error loading todo:', error);
    }
  };

  // Load steps
  const loadSteps = async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.STEPS_BY_TODO_ID(todoId));
      if (response.ok) {
        const data = await response.json();
        setSteps(data || []);
      } else {
        console.error('Failed to load steps:', await response.text());
      }
    } catch (error) {
      console.error('Error loading steps:', error);
    }
  };

  // Save new step
  const saveStep = async (e) => {
    e.preventDefault();
    if (!stepName.trim()) return;

    setIsLoading(true);
    const data = {
      name: stepName,
      is_completed: false,
      is_deleted: false
    };

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.STEPS_BY_TODO_ID(todoId), {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStepName('');
        loadSteps();
      } else {
        console.error('Failed to save step:', await response.text());
      }
    } catch (error) {
      console.error('Error saving step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete step
  const deleteStep = async (stepId) => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.STEP_BY_ID(stepId), {
        method: 'DELETE'
      });

      if (response.ok) {
        loadSteps(); // Refresh steps
      } else {
        console.error('Failed to delete step');
      }
    } catch (error) {
      console.error('Error deleting step:', error);
    }
  };

  // Update step
  const updateStep = async () => {
    if (!updateStepName.trim()) return;

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.STEP_BY_ID(currentStep.id), {
        method: 'PUT',
        body: JSON.stringify({ name: updateStepName })
      });

      if (response.ok) {
        setUpdateModalVisible(false);
        setCurrentStep(null);
        setUpdateStepName('');
        loadSteps(); // Refresh steps
      } else {
        console.error('Failed to update step');
      }
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  // Finish step
  const finishStep = async (step) => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.STEP_BY_ID(step.id), {
        method: 'PUT',
        body: JSON.stringify({
          name: step.name,
          is_completed: true
        })
      });

      if (response.ok) {
        loadSteps(); // Refresh steps
      } else {
        console.error('Failed to finish step');
      }
    } catch (error) {
      console.error('Error finishing step:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    alert('Çıkış yapılıyor...');

    // Delete all cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const cookieName = cookie.split('=')[0].trim();
      document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    }

    window.location.href = '/';
  };

  // Open update modal
  const openUpdateModal = (step) => {
    setCurrentStep(step);
    setUpdateStepName(step.name);
    setUpdateModalVisible(true);
  };

  useEffect(() => {
    const loadData = async () => {
      if (todoId) {
        await loadTodo();
        await loadSteps();
      }
    };

    loadData();
  }, [todoId]); // Only depend on todoId since the functions are stable

  const username = getCookie('username') || 'Bilinmeyen Kullanıcı';

  return (
    <>
      {/* Update Modal */}
      {updateModalVisible && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Step Güncelle</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setUpdateModalVisible(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Yeni ad girin"
                  value={updateStepName}
                  onChange={(e) => setUpdateStepName(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setUpdateModalVisible(false)}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={updateStep}
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand mb-0 h1" href="/todo">{username}</a>
          <div className="d-flex">
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              Çıkış Yap
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="d-flex justify-content-center align-items-center" style={{backgroundColor: '#eee', minHeight: '100vh', paddingTop: '80px'}}>
        <div className="container py-5">
          <div className="row d-flex justify-content-center align-items-center">
            <div className="col col-lg-9 col-xl-9">
              <div className="card rounded-3">
                <div className="card-body p-4">
                  <h4 className="text-center my-3 pb-3">{todoName}</h4>

                  <form className="row row-cols-lg-auto g-3 justify-content-center align-items-center mb-4 pb-2" onSubmit={saveStep}>
                    <div className="col-12">
                      <div className="form-outline">
                        <input
                          type="text"
                          className="form-control"
                          value={stepName}
                          onChange={(e) => setStepName(e.target.value)}
                          placeholder="Enter a step here"
                        />
                        <label className="form-label">Enter a step here</label>
                      </div>
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>

                  <table className="table mb-4">
                    <thead>
                      <tr>
                        <th scope="col">No</th>
                        <th scope="col">Step</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {steps.map((step, index) => (
                        !step.is_deleted && (
                          <tr key={step.id}>
                            <th scope="row">{index + 1}</th>
                            <td>{step.name}</td>
                            <td>{step.is_completed ? "Completed" : "In progress"}</td>
                            <td>
                              <button
                                className="btn btn-success me-1"
                                onClick={() => finishStep(step)}
                                disabled={step.is_completed}
                              >
                                Finished
                              </button>
                              <button
                                className="btn btn-warning me-1"
                                onClick={() => openUpdateModal(step)}
                              >
                                Update
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => deleteStep(step.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Step;
