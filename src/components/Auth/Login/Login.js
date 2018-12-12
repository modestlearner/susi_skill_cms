// Packages
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Components
import CircularProgress from 'material-ui/CircularProgress';
import PasswordField from 'material-ui-password-field';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import $ from 'jquery';
import Cookies from 'universal-cookie';
import { urls, isProduction } from '../../../utils';
import { addUrlProps, UrlQueryParamTypes } from 'react-url-query';
import isEmail from '../../../utils/isEmail';

// Static assets
import './Login.css';

const cookies = new Cookies();
const cookieDomain = isProduction() ? '.susi.ai' : '';

const urlPropsQueryConfig = {
  token: { type: UrlQueryParamTypes.string },
};

const styles = {
  fieldStyle: {
    height: '37px',
    borderRadius: 4,
    border: '1px solid #ced4da',
    fontSize: 16,
    padding: '0px 10px',
    width: '272px',
    marginTop: '10px',
  },
  passwordFieldStyle: {
    height: '37px',
    borderRadius: 4,
    border: '1px solid #ced4da',
    fontSize: 16,
    padding: '0px 10px',
    width: '250px',
    marginTop: '10px',
  },
  inputStyle: {
    height: '35px',
    marginBottom: '10px',
    webkitTextFillColor: 'unset',
  },
  inputPasswordStyle: {
    height: '35px',
    marginBottom: '10px',
    marginRight: '50px',
    width: '90%',
    webkitTextFillColor: 'unset',
  },
};

class Login extends Component {
  static propTypes = {
    token: PropTypes.string,
    onChangeToken: PropTypes.func,
    history: PropTypes.object,
    updateAuthDialog: PropTypes.func,
    updateSnackbar: PropTypes.func,
    closeDialog: PropTypes.func,
  };

  static defaultProps = {
    token: 'null',
  };

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      emailErrorMessage: '',
      password: '',
      passwordErrorMessage: '',
      success: false,
      loading: false,
      showDialog: false,
    };
  }

  componentDidMount() {
    if (cookies.get('loggedIn')) {
      this.props.history.push('/home', { open: false });
    }
  }

  handleSubmit = e => {
    e.preventDefault();

    let { email, password } = this.state;
    const { updateSnackbar, closeDialog } = this.props;
    let BASE_URL = urls.API_URL;

    if (!email || !password) {
      return;
    }

    //eslint-disable-next-line
    const loginEndPoint = `${BASE_URL}/aaa/login.json?type=access-token&login=${email}&password=${encodeURIComponent(
      password,
    )}`;

    if (isEmail(email)) {
      this.setState({ loading: true });
      $.ajax({
        url: loginEndPoint,
        dataType: 'jsonp',
        jsonp: 'callback',
        crossDomain: true,
        success: response => {
          if (response.accepted) {
            cookies.set('serverUrl', BASE_URL, {
              path: '/',
              domain: cookieDomain,
            });
            const accessToken = response.access_token;
            const uuid = response.uuid;
            const time = response.valid_seconds;
            const success = true;
            this.setState({ accessToken, time, success });
            this.setCookies(email, accessToken, uuid, time);
            const message = 'You are logged in';
            updateSnackbar && updateSnackbar(message);
            closeDialog && closeDialog();
          } else {
            password = '';
            const message = 'Login Failed. Try Again';
            this.setState({ password });
            updateSnackbar && updateSnackbar(message);
          }
        },
        error: errorThrown => {
          password = '';
          const message = 'Login Failed. Try Again';
          this.setState({ password });
          updateSnackbar && updateSnackbar(message);
        },
        complete: (jqXHR, textStatus) => {
          this.setState({ loading: false });
        },
      });
    }
  };

  handleChange = event => {
    switch (event.target.name) {
      case 'email': {
        const email = event.target.value.trim();
        this.setState({
          email,
          emailErrorMessage: !isEmail(email)
            ? 'Enter a valid Email Address'
            : '',
        });
        break;
      }
      case 'password': {
        const password = event.target.value.trim();
        const passwordError = !(password.length >= 6 && password);
        this.setState({
          password,
          passwordErrorMessage: passwordError
            ? 'Minimum 6 characters required'
            : '',
        });
        break;
      }
      default:
        break;
    }
  };

  setCookies = (email, loggedIn, uuid, time) => {
    let { success } = this.state;
    if (success) {
      cookies.set('loggedIn', loggedIn, {
        path: '/',
        maxAge: time,
        domain: cookieDomain,
      });
      cookies.set('uuid', uuid, {
        path: '/',
        maxAge: time,
        domain: cookieDomain,
      });
      cookies.set('emailId', this.state.email, {
        path: '/',
        maxAge: time,
        domain: cookieDomain,
      });
      this.props.history.push('/');
      window.location.reload();
    } else {
      this.setState({
        error: true,
        accessToken: '',
        success: false,
      });
    }
  };

  handleSignUp = () => this.props.updateAuthDialog('signup');

  handleForgotPassword = () => this.props.updateAuthDialog('forgotPassword');

  render() {
    const {
      fieldStyle,
      passwordFieldStyle,
      inputStyle,
      inputPasswordStyle,
    } = styles;
    const {
      email,
      password,
      emailErrorMessage,
      passwordErrorMessage,
      loading,
    } = this.state;

    const isValid =
      email && !emailErrorMessage && password && !passwordErrorMessage;

    return (
      <div className="loginForm">
        <div id="loginHeading">Log into SUSI</div>
        <form onSubmit={this.handleSubmit}>
          <div style={{ maxHeight: '70px' }}>
            <TextField
              name="email"
              type="email"
              value={email}
              onChange={this.handleChange}
              style={fieldStyle}
              inputStyle={inputStyle}
              placeholder="Email"
              underlineStyle={{ display: 'none' }}
              errorText={emailErrorMessage}
            />
          </div>

          <div style={{ maxHeight: '70px' }}>
            <PasswordField
              name="password"
              style={passwordFieldStyle}
              inputStyle={inputPasswordStyle}
              value={password}
              placeholder="Password"
              errorText={passwordErrorMessage}
              underlineStyle={{ display: 'none' }}
              onChange={this.handleChange}
              visibilityButtonStyle={{
                marginTop: '-3px',
              }}
              visibilityIconStyle={{
                marginTop: '-3px',
              }}
              textFieldStyle={{ padding: '0px' }}
            />
          </div>

          <RaisedButton
            label={!loading ? 'Log In' : undefined}
            type="submit"
            backgroundColor="#4285f4"
            labelColor="#fff"
            disabled={!isValid}
            style={{ width: '275px', margin: '10px 0px' }}
            icon={loading ? <CircularProgress size={24} /> : undefined}
          />

          <div className="loginLinksSection" id="loginLinks">
            <span
              className="forgotPassword"
              onClick={this.handleForgotPassword}
            >
              Forgot Password?
            </span>
            <span className="signup" onClick={this.handleSignUp}>
              Sign up for SUSI
            </span>
          </div>
        </form>
      </div>
    );
  }
}

export default addUrlProps({ urlPropsQueryConfig })(Login);
