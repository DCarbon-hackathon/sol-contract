import { web3, BN, Wallet, AnchorProvider, Program } from "@coral-xyz/anchor";
import { DcarbonProgram } from "../target/types/dcarbon_program";
import idl from "../target/idl/dcarbon_program.json";
import bs58 from "bs58";
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  findMetadataPda,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { ethers } from "ethers";
require("dotenv").config();

const programID = new web3.PublicKey(process.env.PROGRAM_ID);
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
  const umi = createUmi(web3.clusterApiUrl("devnet")).use(mplTokenMetadata());

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

  const ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY_EVM);

  console.log("ethWallet: ", ethWallet.address);

  // campaign config

  const decimals = 9;
  const fee = 0.05 * 10 ** 9;
  const name = "CARBON";
  const symbol = "CARBON";
  const uri =
    "https://static.innovaz.io/nft/metadata/65ae2eecbc73838f5feea43c/1.json";

  const devices = [
    {
      id: "1",
      deviceType: 1,
      limitAmount: new BN(10 * 10 ** 9),
      owner: owner.publicKey.toString(),
    },
  ];

  const mint = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), new BN(programIndex).toArrayLike(Buffer, "le", 1)],
    programID
  )[0];
  console.log("mint: ", mint.toString());

  // get config of campaign
  const projectState = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("project"), mint.toBuffer()],
    programID
  )[0];
  console.log("projectState: ", projectState);

  // get derive metadata account of nft collection
  let metadataAccount = findMetadataPda(umi, {
    mint: publicKey(mint),
  })[0];
  console.log("metadataAccount: ", metadataAccount);

  const tx = await program.methods
    .initialize({
      programIndex: programIndex,
      decimals: decimals,
      fee: new BN(fee),
      name: name,
      symbol: symbol,
      uri: uri,
      devices: devices,
      ethAddress: Array.from(ethers.utils.arrayify(ethWallet.address)),
    })
    .accounts({
      owner: admin.publicKey,
      mint: mint,
      projectState: projectState,
      metadataAccount: metadataAccount,
      systemProgram: SYSTEM_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([admin])
    .rpc();
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  await connection.confirmTransaction(tx, "confirmed");

  const stateData = await program.account.projectState.fetch(projectState);
  console.log("projetState: ", stateData);
};

main();
