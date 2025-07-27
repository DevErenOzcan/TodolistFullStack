import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';

const Todo = () => {
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [updateTaskName, setUpdateTaskName] = useState('');
  const navigate = useNavigate();

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

  // Get tasks from API
  const getTasks = async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.TODOS);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Save new task
  const saveTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    setIsLoading(true);
    const data = {
      name: taskName,
      complete_perc: 0,
      is_deleted: false
    };

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.TODOS, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setTaskName('');
        getTasks();
      } else {
        console.error('Failed to save task:', await response.text());
      }
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.TODO_BY_ID(taskId), {
        method: 'DELETE'
      });

      if (response.ok) {
        getTasks(); // Refresh tasks
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Update task
  const updateTask = async () => {
    if (!updateTaskName.trim()) return;

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.TODO_BY_ID(currentTask.ID), {
        method: 'PUT',
        body: JSON.stringify({ todo_name: updateTaskName })
      });

      if (response.ok) {
        setUpdateModalVisible(false);
        setCurrentTask(null);
        setUpdateTaskName('');
        getTasks(); // Refresh tasks
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
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
  const openUpdateModal = (task) => {
    setCurrentTask(task);
    setUpdateTaskName(task.name);
    setUpdateModalVisible(true);
  };

  useEffect(() => {
    getTasks();
  }, []);

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
                  value={updateTaskName}
                  onChange={(e) => setUpdateTaskName(e.target.value)}
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
                  onClick={updateTask}
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
                  <h4 className="text-center my-3 pb-3">To Do App</h4>

                  <form className="row row-cols-lg-auto g-3 justify-content-center align-items-center mb-4 pb-2" onSubmit={saveTask}>
                    <div className="col-12">
                      <div className="form-outline">
                        <input
                          type="text"
                          className="form-control"
                          value={taskName}
                          onChange={(e) => setTaskName(e.target.value)}
                          placeholder="Enter a task here"
                        />
                        <label className="form-label">Enter a task here</label>
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
                        <th scope="col">TodoId</th>
                        <th scope="col">UserId</th>
                        <th scope="col">Todo</th>
                        <th scope="col">Complete</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.slice(0, 10).map((task) => (
                        !task.is_deleted && (
                          <tr key={task.id}>
                            <th scope="row">{task.id}</th>
                            <td>{task.user_id}</td>
                            <td>{task.name}</td>
                            <td>%{task.complete_perc}</td>
                            <td>
                              <button
                                className="btn btn-success btn-detail ms-1"
                                onClick={() => navigate(`/todo/${task.id}`)}
                              >
                                Detail
                              </button>
                              <button
                                className="btn btn-warning ms-1"
                                onClick={() => openUpdateModal(task)}
                              >
                                Update
                              </button>
                              <button
                                className="btn btn-danger ms-1"
                                onClick={() => deleteTask(task.id)}
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

export default Todo;
