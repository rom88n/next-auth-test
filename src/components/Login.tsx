'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { FC, useState } from 'react';
import apiCaller from '@/components/axios';

const Login: FC = () => {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('rtsekov+premium@s-pro.io');
  const [pass, setPass] = useState('Roman147369');

  const getCompany = async () => {
    const data =  await apiCaller.get('user/company/v2/')
    await apiCaller.get('user/team_members/')
    // console.log('company', data)
  }

  const getTeamMembers = async () => {
    const data =  await apiCaller.get('user/team_members/')
    // console.log('company', data)
  }

  return (
    <div>

      {status === 'authenticated' ? (
        <>
          You are authenticated
          <br/>
          <br/>
          <button onClick={() => getTeamMembers()}>get TeamMembers</button>
          <br/>
          <br/>
          <button onClick={() => getCompany()}>get userCompany</button>
          <br/>
          <br/>
          <button onClick={() => signOut()}>logout</button>
        </>
      ) : (
        <>
          <input name="email" type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
          <br/>
          <input name="password" type="text" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)}/>
          <br/>
          <button onClick={() => signIn('credentials', { email, password: pass, callbackUrl: "/login"}, { email, password: pass })}>login</button>
          <br/>
          <br/>
          <button onClick={() => getTeamMembers()}>get TeamMembers</button>
          <br/>
          <br/>
          <button onClick={() => getCompany()}>get userCompany</button>
        </>
      )}
      <br/>
      <br/>
      <a href="/">home</a>
    </div>
  );
};

export default Login;
