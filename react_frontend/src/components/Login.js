import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        body: formData,
      });
      console.log(response)

      if (response.ok) {
        const data = await response.json();

        // LAN'da çalışması için cookie ayarlarını düzenle
        // Secure flag'ini kaldır ve samesite'ı lax yap
        const cookieOptions = `path=/; max-age=${60 * 60 * 24}; samesite=lax`;
        document.cookie = `auth_token=${data.token}; ${cookieOptions}`;
        document.cookie = `username=${data.username}; ${cookieOptions}`;

        // Debug: Cookie'lerin ayarlandığını kontrol et
        console.log('Cookies set:', document.cookie);

        // Navigate to todo page using React Router
        navigate('/todo');
      } else {
        console.error("Login error:", await response.text());
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="vh-100" style={{
      background: 'linear-gradient(to right, #667db6, #0082c8, #0082c8, #667db6)'
    }}>
      <div className="container py-5 h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card bg-dark text-white" style={{ borderRadius: '1rem' }}>
              <div className="card-body p-5 text-center">
                <div className="mb-md-5 mt-md-4 pb-5">
                  <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
                  <p className="text-white-50 mb-5">Please enter your username and password!</p>

                  <form onSubmit={handleLogin}>
                    <div className="form-outline form-white mb-4">
                      <input
                        type="text"
                        id="typeEmailX"
                        className="form-control form-control-lg"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                      <label className="form-label" htmlFor="typeEmailX">
                        Username
                      </label>
                    </div>

                    <div className="form-outline form-white mb-4">
                      <input
                        type="password"
                        id="typePasswordX"
                        className="form-control form-control-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <label className="form-label" htmlFor="typePasswordX">
                        Password
                      </label>
                    </div>

                    <button
                      className="btn btn-outline-light btn-lg px-5"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
