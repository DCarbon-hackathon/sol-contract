import { web3, BN, Wallet, AnchorProvider, Program } from "@coral-xyz/anchor";
import { DcarbonProgram } from "../target/types/dcarbon_program";
import idl from "../target/idl/dcarbon_program.json";
import bs58 from "bs58";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { ethers } from "ethers";
require("dotenv").config();

const programID = new web3.PublicKey(process.env.PROGRAM_ID);
const ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY_EVM);
const programIndex = parseInt(process.env.PROGRAM_INDEX);

const main = async () => {
  // LIST KEYPAIR
  const SYSTEM_PROGRAM_ID = new web3.PublicKey(
    "11111111111111111111111111111111"
  );

  //   SET PROGRAM
  const connection = new web3.Connection(
    web3.clusterApiUrl("devnet"),
    "confirmed"
  );

  const wallet = new Wallet(
    web3.Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY_SOLANA_1))
  );

  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "recent",
    commitment: "processed",
  });
  //@ts-ignore
  const program = new Program(idl as DcarbonProgram, programID, provider);

  console.log("programId: ", program.programId);

  const admin = web3.Keypair.fromSecretKey(
    bs58.decode(process.env.PRIVATE_KEY_SOLANA_1)
  );

  const owner = web3.Keypair.fromSecretKey(
    bs58.decode(process.env.PRIVATE_KEY_SOLANA_2)
  );

  // campaign config
  const deviceId = "1";
  const amount = 1 * 10 ** 9;

  const name = "DCARBON NFT";
  const symbol = "DCARBON NFT";
  const uri =
    "https://static.innovaz.io/nft/metadata/65ae2eecbc73838f5feea43c/1.json";

  const mint = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), new BN(programIndex).toArrayLike(Buffer, "le", 1)],
    programID
  )[0];
  console.log("mint: ", mint.toString());

  const tokenAccount = await getAssociatedTokenAddress(mint, owner.publicKey);
  console.log("tokenAccount: ", tokenAccount.toString());

  const feeTokenAccount = await getAssociatedTokenAddress(
    mint,
    admin.publicKey
  );
  console.log("feeTokenAccount: ", feeTokenAccount.toString());

  // get config of campaign
  const projectState = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("project"), mint.toBuffer()],
    programID
  )[0];
  console.log("projectState: ", projectState);

  let stateData = await program.account.projectState.fetch(projectState);
  console.log("projetState: ", stateData);

  const nonce = stateData.devices
    .find((device) => device.id == deviceId)
    ?.nonce.add(new BN(1));

  const signature = await getSignature(deviceId, amount, nonce.toNumber());

  const transaction = new web3.Transaction().add(
    web3.Secp256k1Program.createInstructionWithEthAddress({
      ethAddress: ethers.utils.arrayify(ethWallet.address),
      message: signature.actualMessage,
      signature: signature.signature,
      recoveryId: signature.recoveryId,
    }),
    await program.methods
      //@ts-ignore
      .mintToken({
        programIndex: programIndex,
        deviceId: deviceId,
        amount: new BN(amount),
        nonce: new BN(nonce),
        name: name,
        symbol: symbol,
        uri: uri,
        signature: signature.signature,
        recoveryId: signature.recoveryId,
      })
      .accounts({
        owner: owner.publicKey,
        mint: mint,
        tokenAccount: tokenAccount,
        projectState: projectState,
        systemProgram: SYSTEM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        sysvar: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([owner])
      .instruction()
  );

  let tx = await web3.sendAndConfirmTransaction(connection, transaction, [
    owner,
  ]);

  await connection.confirmTransaction(tx, "confirmed");
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  // featch update data
  stateData = await program.account.projectState.fetch(projectState);
  console.log("projetState: ", stateData);
};

const getSignature = async (
  deviceId: string,
  amount: number,
  nonce: number
) => {
  let keccak256Mesage = ethers.utils.solidityKeccak256(
    ["string", "string", "string"],
    [deviceId, amount.toString(), nonce.toString()]
  );
  let msgDigest = ethers.utils.arrayify(keccak256Mesage);

  let actualMessage = Buffer.concat([
    Buffer.from("\x19Ethereum Signed Message:\n32"),
    ethers.utils.arrayify(keccak256Mesage),
  ]);

  const messageHashBytes = ethers.utils.arrayify(msgDigest);
  const signatureRaw = await ethWallet.signMessage(messageHashBytes);

  // console.log("signatureRaw: ", signatureRaw);
  let fullSigBytes = ethers.utils.arrayify(signatureRaw);

  return {
    actualMessage,
    signature: fullSigBytes.slice(0, 64),
    recoveryId: fullSigBytes[64] - 27,
  };
};

main();
